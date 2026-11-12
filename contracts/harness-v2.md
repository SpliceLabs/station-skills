# `station/harness@2`

What Station hands a docked harness that speaks the second version, and the only answer it accepts back. It sits beside [`station/harness@1`](harness-v1.md), which is unchanged; a harness answers one version, and a docking names which. The harness is handed up to eight reads from docked sources, a caller's brief, and an approved context document, and answers with outputs, each about one item it was handed; it sends nothing anywhere. The code is `src/docking/harness-contract-v2.ts`, which a harness vendors a copy of; the JSON Schema is [`harness-v2.schema.json`](harness-v2.schema.json), the run's arguments and answer under `$defs`. It is generated from that code by `bun run contracts:schemas`, and Station checks some rules beyond it, which the schema's `description` lists. The decisions behind it are docked services may speak the @2 contracts beside @1 and Station refuses outputs not grounded in the items it handed over. Every harness also answers [`station/describe@1`](describe-v1.md) with `contract: "station/harness@2"`, is called only at the config hash and model a docking pinned, and authenticates Station exactly as a source does ([`source-v1.md`](source-v1.md#authentication)).

## Tool: `harness_run`

Arguments:

```json
{
  "run_id": "<one safe path segment>",
  "reads": [
    { "contract": "station/source@2", "docking": "crm", "reference": "<Station's ledger record of the read>", "simulated": false,
      "items": [{ "ref": "d-1", "kind": "deal", "remote_id": "...", "updated_at": "...", "link": null, "mapping_version": null, "fields": {} }] },
    { "contract": "station/source@1", "docking": "notes", "reference": "<Station's ledger record of the read>", "simulated": true,
      "items": [{ "item_id": "n-1", "fields": {} }] }
  ],
  "brief": "<the caller's brief, up to 4096 bytes, or null>",
  "context": { "...": "exactly station/harness@1's context" }
}
```

- `run_id` is as under `@1`.
- `reads` holds 1-8 reads and at most 50 items across all of them. Each read says which source contract it was, and that decides its items: a `station/source@2` read carries [`@2` items](source-v2.md#answer), named by `ref`; a `station/source@1` read carries [`@1` items](source-v1.md#source_read), named by `item_id`. `docking` is the docking whose source was read, `reference` (1-256 bytes) is Station's ledger record of that read, and `simulated` is what the source said.
- Every read of one docking is of the same source contract; no read is handed over twice; and no item is handed over twice from one docking. The same ref from two dockings is two items.
- `context` is the approved context document exactly as [`@1` hands it](harness-v1.md#tool-harness_run).

### The brief

`brief` is the caller's own words about what they want from this run, or `null`. **Station carries it, never reads it, and never records it**: it reaches the harness as it was given, bounded at 4096 bytes, UTF-8, and appears in no ledger entry, run record, held output or log. What a harness does with it is the harness's. A brief is not approved the way a context document is, so a harness should treat it as a request, not as a rule.

## Answer

As under [`@1`](harness-v1.md#tool-harness_run), except that each output and held-back entry names the docking as well as the item, the way that item's read named it:

```json
{
  "contract": "station/harness@2",
  "run_id": "<the run_id it was handed>",
  "config_hash": "<the config hash it ran at>",
  "verdict": "blocked | not-ready | ready-with-caveats | ready",
  "findings": { "<name>": ["<text up to 1000 bytes>"] },
  "outputs": [
    { "docking": "crm", "ref": "d-1", "payload": { "...": "any JSON" } },
    { "docking": "notes", "item_id": "n-1", "payload": { "...": "any JSON" } }
  ],
  "held_back": [{ "docking": "crm", "ref": "d-2" }]
}
```

A payload is any JSON object of at most 16 KiB, serialized as UTF-8, nested at most 32 deep, with no `__proto__`, `constructor` or `prototype` key anywhere. A harness that did not run answers the shared [error answer](errors.md) in place of a result. `readRunReplyV2` reads either.

## What Station refuses

Station refuses the whole answer, never trims it, when:

- a field is extra or missing, the `contract` is another, or the `run_id` is not the one handed over;
- `config_hash` is not the one docked;
- an output or held-back entry names both a `ref` and an `item_id`, or neither;
- an output names a docking and item that was not handed over: another docking, a ref no read of that docking carried, or a `ref` for an item its read named by `item_id`, or the reverse;
- an output names an item another output names;
- a held-back entry names an item not handed over, repeats, or also has an output;
- the verdict is `blocked` and there are outputs;
- the answer is nested too deep to parse safely, or holds a prototype key anywhere: both are refused before parsing.

The grounding check is `ungroundedOutputsV2`. It compares dockings and item names as values, never joined into one string, so no docking or ref can be made to collide with another. A refusal names the rule, the contract field and an output's position, never a docking, ref, item id, key or value the harness wrote.

Every length bound in this contract counts UTF-8 bytes, not characters. Payloads are not read.

## Versioning

A breaking change is `station/harness@3`.
