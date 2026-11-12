# `station/source@1`

What a docked source answers: the only shape Station accepts from it. A source supplies items; Station carries each item's fields without reading them. The code that reads it is `src/docking/source-contract.ts`, which a source vendors a copy of; the JSON Schema is [`source-v1.schema.json`](source-v1.schema.json), each tool's arguments and answer under `$defs`. It is generated from that code by `bun run contracts:schemas`, and Station checks some rules beyond it, which the schema's `description` lists. The decision behind it is docked services speak the source and harness contracts. Every source also answers [`station/describe@1`](describe-v1.md), and is called only at the config hash and model a docking pinned.

## Tools

### `source_identity`

Arguments: `{}`. Answer:

```json
{ "contract": "station/source@1", "source": { "id": "<what this source answers for, 1-256 chars>" } }
```

Station observes the id as the docking's source node. A read is treated as performed on that source only while the source still answers for the id Station observed.

### `source_read`

Arguments: `{ "limit": 1-50, "selector"?: "<one token>" }`. A selector narrows the read to one of the source's named sets; without one the source reads its default set. A token is `^[A-Za-z0-9][A-Za-z0-9._:-]{0,127}$`.

Answer:

```json
{
  "contract": "station/source@1",
  "source": { "id": "<the same id as source_identity>" },
  "simulated": false,
  "items": [{ "item_id": "<one token>", "fields": { "...": "any JSON" } }]
}
```

`fields` is any JSON object of at most 16 KiB serialized, with keys of 1-128 characters. Station bounds it and reads nothing in it. `simulated: true` says the data is not live, and travels with every answer.

Station refuses, never trims:

- an extra field anywhere, or a missing one;
- a `contract` other than `station/source@1`;
- more items than `limit`, a repeated `item_id`, an id that is not one token, or an item over the size bound.

## Failures

A source signals failure with an MCP tool error (`isError: true`) whose first text starts with:

| Prefix | Meaning | What Station reports |
|---|---|---|
| `refused:` | The source answered no | A remote refusal: `execution_failed` |
| `unavailable:` | Nothing was done | Not sent: `unavailable` |
| anything else, a timeout, or a dropped connection after sending | Station cannot tell whether the call took effect | Unknown outcome: `outcome_unknown` |

## Authentication

Every call carries `Authorization: Bearer <token>`, a JWT Station signs for that one service:

| Claim | Value |
|---|---|
| header `typ` | `station-harness+jwt` |
| `iss` | Station's workload issuer |
| `sub` | Station's connector id for this service |
| `aud` | the service's own URL, exactly |
| `exp` | at most 120 seconds after `iat` |
| `jti` | unique per token |

The service verifies the signature against Station's public JWKS, checks `iss`, `aud`, `typ` and `exp` with no clock tolerance, and refuses a `jti` it has already seen within the token's lifetime (`../reference/connector-token.ts`, which a service vendors a copy of). It accepts nothing else: no agent token, no static key.

## Versioning

A change that would make an old answer invalid, or an old source unable to answer, is a new version, `station/source@2`, and Station names the version it expects. A source answers one version.
