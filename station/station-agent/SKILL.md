---
name: station-agent
description: "Enroll an agent that runs on its own (a chief-of-staff agent, a scheduled assistant) so it signs in to Splice Station with its own key and acts for the person who owns it: make its key pair, propose it with station_propose_agent, have another administrator confirm it, and sign it in through the client-credentials flow. Use when someone asks how to give their agent its own identity in Station, how an agent signs in, or how to rotate or remove an agent's key."
metadata:
  version: "1"
  uses-station-tools: "station_about station_whoami station_propose_agent station_confirm_agent station_list_agents station_rotate_agent_key station_unenroll_agent station_grant_access station_stop"
---

# Enroll an agent in Station

An agent that runs by itself needs an identity of its own in Station. It acts for one person, its **owner**, and never beyond what both the agent's grant and its owner allow. Station holds only the agent's **public** keys. The private key stays with the agent and is never sent to Station, in any tool call.

This guide is for the assistant helping the owner. Follow it in order.

## 1. Make the agent's key pair, where the agent runs

Make one P-256 (ES256) key pair on the machine or service the agent runs on, and keep its private key there, readable only by the agent. For example, with openssl:

```bash
openssl ecparam -name prime256v1 -genkey -noout | openssl pkcs8 -topk8 -nocrypt -out agent-key.pem
chmod 600 agent-key.pem
```

Send Station the public key as a JWKS: `kty`, `crv`, `x` and `y`, with `kid` set to the key's RFC 7638 thumbprint. Most JOSE libraries compute it (`calculateJwkThumbprint` in `jose`). A key with a private member such as `d` is refused, and nothing of it is kept or repeated back. If that happens, treat the key as exposed and make a new pair.

At most four keys per agent, and no key shared with another agent.

## 2. The owner proposes it

The owner calls `station_propose_agent` with the agent's `name` (lowercase letters, digits and hyphens), what it is for (`purpose`), `publicKeys` and a reason. Two fields are optional:

- `dockings` names the docked services it should act with. Each one must be a service the owner may use, or the proposal is refused.
- `assists` are for an owner who administers: `approvals` lets the agent list what waits for the owner to decide (never decide it), and `proposals` lets it propose and ask for them.

For example (the key's values here are placeholders of the right shape):

```json station_propose_agent
{
  "name": "chief-of-staff",
  "purpose": "Prepares my day from my calendar and inbox",
  "publicKeys": { "keys": [{ "kty": "EC", "crv": "P-256", "x": "f83OJ3D2xF1Bg8vub9tLe1gHMzV76e8Tus9uPHvRVEU", "y": "x_FEzRu9m36HLN_tue659LNpXW6pCyStikYjKIWI5a0", "kid": "NzbLsXh8uDCcd-6MNwXF4W_7noWXFZAfHkxZsRGC9Xs" }] },
  "reason": "My own assistant, so it signs in as itself"
}
```

Nothing is enrolled yet. The answer has a `digest`.

## 3. Another administrator confirms it

A Station administrator other than the owner reads the proposal in `station_list_agents` and confirms it with `station_confirm_agent` and the digest. The owner can never confirm their own agent. Once confirmed, the agent is enrolled and in force at once, with no restart. The enrollment is recorded in the ledger as proposed by the owner and approved by that administrator, the same record the operator's offline enrollment makes.

A docking reaches an agent only through that docking's own revision. If the proposal named `dockings`, an administrator docks them naming the agent.

## 4. The agent signs in with its key

The agent uses the OAuth client-credentials flow with a signed key assertion (RFC 7523, `private_key_jwt`). Ask `station_about` for the MCP address (`addresses.mcp`), then:

1. Sign a JWT with the private key, ES256: `iss` and `sub` are the agent's name, `aud` is the MCP listener's origin (or its token endpoint, `<origin>/v1/workloads/token`), `iat` now, `exp` at most 300 seconds later, and a fresh unique `jti`. A `kid` header is optional; give it to name the key.
2. POST it to `<origin>/v1/workloads/token` as a form: `grant_type=client_credentials`, `client_assertion_type=urn:ietf:params:oauth:client-assertion-type:jwt-bearer`, `client_assertion=<the JWT>`.
3. Use the `access_token` it returns (valid 10 minutes) as a Bearer token at `<origin>/v1/mcp`. Sign a new assertion for each exchange: one is never accepted twice.

A standard MCP client SDK that supports `private_key_jwt` client credentials does all of this, given the agent's name as its client id and its private key.

Then the agent reads `station_whoami`: it names the person it acts for and what it may use for them.

## Changing it later

- **Rotate keys.** The owner, and only the owner, calls `station_rotate_agent_key` with the new public key set and a reason. The new keys work at once and the old ones are refused. A token already issued lasts at most 10 minutes. Rotation widens nothing, so no second person is asked; it is recorded under the owner.
- **Unenroll.** The owner or any administrator calls `station_unenroll_agent`. Everything the agent was granted ends at once, its next call is refused, and its name is retired.
- **Stop it now.** An administrator can also `station_stop` it, which an undo by two administrators reverses.

An agent the operator enrolled in Station's configuration is changed by the operator, offline, not with these tools.
