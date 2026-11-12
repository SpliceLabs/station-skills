# `station/harness@1`

What Station hands a docked harness and the only answer it accepts back. The harness is handed items a docked source supplied and an approved context document, and answers with outputs, each about one of those items; it sends nothing anywhere. Station carries the items, the context content and each output's payload without reading them. The code is `src/docking/harness-contract.ts`, which a harness vendors a copy of; the JSON Schema is [`harness-v1.schema.json`](harness-v1.schema.json), the run's arguments and answer under `$defs`. It is generated from that code by `bun run contracts:schemas`, and Station checks some rules beyond it, which the schema's `description` lists. The decisions behind it are docked services speak the source and harness contracts and Station refuses outputs not grounded in the items it handed over. Every harness also answers [`station/describe@1`](describe-v1.md), is called only at the config hash and model a docking pinned, and authenticates Station exactly as a source does ([`source-v1.md`](source-v1.md#authentication)).

## Tool: `harness_run`

Arguments:

```json
{
  "run_id": "<one safe path segment>",
  "items": [{ "item_id": "<one token>", "fields": { "...": "any JSON" } }],
  "provenance": { "reference": "<Station's ledger record of the read>", "source": "<the source's configured name>", "simulated": true },
  "context": {
    "context_id": "<one token>", "version": 1, "content": { "...": "any JSON" },
    "provenance": { "source": "station", "revision": "<the approving revision>", "approved_by": "<the approver>", "content_hash": "<sha256 hex>" }
  }
}
```

`run_id` is `^[A-Za-z0-9][A-Za-z0-9._-]{0,127}$`, derived by Station from the deployment, docking, agent and the agent's retry key, so it names no other agent's run. The items are exactly a read Station recorded for that agent on that docking, at most 50, each at most 16 KiB. `content` is the approved context document, at most 64 KiB; `content_hash` is the sha256 of the document's canonical encoding.

Answer:

```json
{
  "contract": "station/harness@1",
  "run_id": "<the run_id it was handed>",
  "config_hash": "<the config hash it ran at>",
  "verdict": "blocked | not-ready | ready-with-caveats | ready",
  "findings": { "<name>": ["<text up to 1000 chars>"] },
  "outputs": [{ "item_id": "<an item it was handed>", "payload": { "...": "any JSON" } }],
  "held_back": ["<an item it was handed and produced no output for>"]
}
```

A payload is any JSON object of at most 16 KiB.

Station refuses the whole answer, never trims it, when:

- a field is extra or missing, the `contract` is another, or the `run_id` is not the one handed over;
- `config_hash` is not the one docked;
- an output names an item not handed over, or an item another output names;
- a held-back id names an item not handed over, repeats, or also has an output;
- the verdict is `blocked` and there are outputs.

A refused answer is recorded as a remote refusal with the rule that broke and an output's position, never an item id or field. A `blocked` answer with no outputs is held, so its findings can be reviewed.

## What Station does with an answer

The value returned is held, outside the ledger, for a person to approve or reject each output; the ledger records its content address and a run record of counts, ids and hashes. See held outputs.

## Failures and versioning

As for [`station/source@1`](source-v1.md#failures): `refused:`, `unavailable:`, or an unknown outcome. A breaking change is `station/harness@2`.
