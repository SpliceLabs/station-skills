# Describe contract `station/describe@1`

What every service Station docks answers about itself: a source ([`station/source@1`](source-v1.md)) and a harness ([`station/harness@1`](harness-v1.md)) alike. The decision behind it is a docking is an explicit operator revision pinned to each service's config hash and model. The code that reads it is `src/docking/describe.ts`; the JSON Schema is [`describe-v1.schema.json`](describe-v1.schema.json). It is generated from that code by `bun run contracts:schemas`, and Station checks some rules beyond it, which the schema's `description` lists. [`station/describe@2`](describe-v2.md) sits beside it and adds what a service is for; a service answering `@1` is read exactly as before.

## The tool

`station_describe`, arguments `{}`, answers `structuredContent` exactly:

```
{ "describe": "station/describe@1",
  "contract": "<the contract it answers, e.g. station/source@1>",
  "name": "<kebab-case>", "version": "<semver>",
  "config_hash": "<64 lowercase hex>",
  "tools": ["<tool names it answers besides station_describe>"],
  "reads": ["<what it reads, plain words>"], "writes": [],
  "data": ["<categories of personal data it handles, plain words>"],
  "model": null | { "provider": "<e.g. anthropic>", "model": "<model id>" },
  "models": [ { "provider": "<provider>", "model": "<model id>" } ] }
```

- **`config_hash`** changes whenever the service's behaviour-defining code, allowlist, contracts or policy change. How it is computed is the service's own; Station compares it and nothing else.
- **`writes`** says, in plain words, what the service changes outside Station (for a factory, "branches and pull requests in the repositories it is given"; for a read-only source, nothing: `[]`). At most 32, each named once. The reviewer approves this list when docking the service, and it is pinned with the config hash and model: a service declaring other writes than were approved (order aside) is not called until it is docked again. What a write does is the service's own: Station decides who may ask for the work and records it, but does not see inside the service.
- **`models`** is optional, for a service that lets a caller choose a model for one call. It lists every model on offer, at most 8, once each, and includes `model`, which is then the default. Docking pins the whole list and refuses any model outside the configuration's `approvedModels`, so choosing among them needs no new decision, and changing the list needs a new docking.
- **`model`** names the model provider that sees the data, or `null` for a model-free service. Docking pins it with the config hash: a service that names another model is not called until it is docked again (each docking names the models its services may use and pins the one each names); a docking whose service names a model outside its approved list is never adopted.

It takes the same Station-signed token as every other tool (`station-harness+jwt`, audience the service's own URL; see [`source-v1.md`](source-v1.md#authentication)).

## How Station uses it

- **Docking.** `station-intake dock` asks every configured service, prints each answer and the hash it would pin, and with `--apply` records the answers and pins each hash and model in one governed revision.
- **Every call.** In the same MCP session, before the tool call, Station asks again. If the contract, `config_hash` or `model` differs from what the docking pinned, or the service is configured at another URL than it was docked at, Station makes no tool call and refuses the agent's call as `redock_needed` (or `not_docked` when nothing is docked for that URL), never as something to resend. A service that does not answer at all is `unavailable`. Docking again at the new hash is how a changed service is trusted.

Answers are read strictly: an extra or missing field, an uppercase or short hash, or a name that is not kebab-case is refused.
