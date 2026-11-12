import { createLocalJWKSet, decodeProtectedHeader, jwtVerify, type JWK } from "jose";

/**
 * How a docked service checks the token Station signed for it. The service holds only Station's public key set and
 * accepts nothing else: not an agent's token, not a static key. Every check is exact, with no clock tolerance, as
 * Station's own token endpoint is. A service outside this repository vendors a copy of this function.
 */
export const CONNECTOR_TOKEN_TYPE = "station-harness+jwt";
export const CONNECTOR_TOKEN_SECONDS = 120;
const MAX_TOKEN_BYTES = 8192;
const MAX_REMEMBERED = 10_000;

export type ConnectorTokenRefusal = "missing" | "malformed" | "type" | "signature" | "claims" | "lifetime" | "replayed" | "capacity";

export interface ConnectorTokenCheck {
  /** Station's public key set, as Station publishes it. */
  readonly keys: () => readonly JWK[];
  /** Station's workload issuer. */
  readonly issuer: string;
  /** This connector's own URL, exactly as Station is configured to reach it. */
  readonly audience: string;
}

/**
 * Returns a checker that remembers the token ids it accepted until they expire, so a copied token is refused the second
 * time. One checker per connector process.
 */
export function createConnectorTokenCheck(check: ConnectorTokenCheck) {
  const seen = new Map<string, number>();
  return async (authorization: string | null, nowMs: number): Promise<{ ok: true; subject: string } | { ok: false; reason: ConnectorTokenRefusal }> => {
    const token = authorization?.startsWith("Bearer ") ? authorization.slice(7) : null;
    if (!token) return { ok: false, reason: "missing" };
    if (token.length > MAX_TOKEN_BYTES) return { ok: false, reason: "malformed" };
    let header;
    try { header = decodeProtectedHeader(token); } catch { return { ok: false, reason: "malformed" }; }
    // Agent and executor tokens are typed JWT; only a token Station signed for a connector carries this type.
    if (header.typ !== CONNECTOR_TOKEN_TYPE || header.alg !== "ES256") return { ok: false, reason: "type" };
    let payload;
    try {
      ({ payload } = await jwtVerify(token, createLocalJWKSet({ keys: [...check.keys()] }), { algorithms: ["ES256"], typ: CONNECTOR_TOKEN_TYPE,
        issuer: check.issuer, audience: check.audience, currentDate: new Date(nowMs), clockTolerance: 0, requiredClaims: ["iat", "exp", "jti", "sub"] }));
    } catch (error) {
      const code = (error as { code?: string }).code ?? "";
      return { ok: false, reason: code === "ERR_JWS_SIGNATURE_VERIFICATION_FAILED" || code === "ERR_JWKS_NO_MATCHING_KEY" ? "signature" : "claims" };
    }
    const issuedAt = payload.iat! * 1000, expiresAt = payload.exp! * 1000, jti = payload.jti!;
    if (nowMs < issuedAt || expiresAt - issuedAt > CONNECTOR_TOKEN_SECONDS * 1000 || jti.length === 0 || jti.length > 256) return { ok: false, reason: "lifetime" };
    for (const [id, until] of seen) if (until <= nowMs) seen.delete(id);
    if (seen.has(jti)) return { ok: false, reason: "replayed" };
    if (seen.size >= MAX_REMEMBERED) return { ok: false, reason: "capacity" };
    seen.set(jti, expiresAt);
    return { ok: true, subject: payload.sub! };
  };
}
