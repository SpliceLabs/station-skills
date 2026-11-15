# Service contract `station/service@1`

The one contract a docked service speaks, whatever it does. A service has no role. It lists its **operations**, and each operation declares its effects from a fixed vocabulary; Station's rules attach to those declarations. It sits beside the per-role contracts ([`describe@2`](describe-v2.md), [`source@2`](source-v2.md), [`harness@2`](harness-v2.md), [`factory@2`](factory-v2.md)) until our own services move to it; nothing docks with it yet.

The shapes are `src/docking/service-contract.ts` and `src/docking/task-status.ts`; what Station checks beyond them is `src/docking/effect-checker.ts`. The JSON Schema is [`service-v1.schema.json`](service-v1.schema.json), generated from that code by `bun run contracts:schemas`; its `description` lists every rule Station checks beyond it. The decision behind it is Station decides on declared effects, not roles.

## Describe

`station_describe`, arguments `{}`, answers:

```
{ "contract": "station/service@1",
  "name": "<kebab-case>", "version": "<semver>", "config_hash": "<64 lowercase hex>",
  "model": null | { "provider": "...", "model": "..." }, "models": [ ... ],
  "purpose": "...", "use_when": ["..."], "not_for": ["..."],
  "examples": [ { "ask": "...", "operation": "<operation name>" } ], "limits": ["..."],
  "reporting_interval_seconds": null | 30-600,
  "task_calls": ["status", "cancel", "content"],
  "operations": [
    { "name": "<a-z0-9_>", "summary": "...",
      "input_schema": { "type": "object", "additionalProperties": false, "properties": { ... }, "required": [ ... ] },
      "effects": { "takes": ["args", "handed", "own"], "gives": "records", "kinds": ["company"],
                   "changes": "nothing", "reaches_out": false, "spends": null, "calls_back": false,
                   "runs": "now", "credential": "station" } } ] }
```

`purpose`, `use_when`, `not_for`, `examples` and `limits` are bounded and hold the text rule exactly as in `describe@2`; an example names an operation instead of a tool. Callers see each operation as `<docking>_<operation>`. `describe`, `status`, `cancel` and `content` are the contract's own calls and no operation may take those names.

## The effect vocabulary

| Field | Answers | Means |
|---|---|---|
| `takes` | any of `args`, `handed`, `own` | the caller's arguments; items Station read for the person and hands over; the service's own stored data |
| `gives` | `nothing`, `records`, `derived`, `reference` | records each with `ref`, `kind`, `updated_at`, `mapping_version` and fields tagged by kind; content naming the handed items it came from; a reference to something it made |
| `kinds` | item kinds | for `records` only: the kinds its records are of |
| `changes` | `nothing`, `own`, `target` | its own state, or an outside system named by a typed input field |
| `target` | `{ field, kind }` | for `target` only: the input field that names the system, and its kind (`repository`, `record`, `channel`, `document`, `calendar`, or `x-`) |
| `reaches_out` | boolean | mail, a public post, a webhook to someone else |
| `spends` | null or `{ unit: "usd", reports }` | `reports` is `answer` for an operation that runs now, `status` for a task |
| `calls_back` | boolean | calls into Station as an enrolled agent for its owner |
| `runs` | `now`, `task` | answers within the call, or starts a task followed by `status` and ended by `cancel` |
| `credential` | `station`, `own` | whose credential the effects use: one Station holds and brokers, or the service's own |

The old roles, as declarations: a CRM read takes `args` and gives `records`; a CRM update gives a `reference` and changes a `target`; a brain's search takes `args` and `own` for `records`, its save changes `own`; a harness run takes `handed` and `own`, gives `derived`, spends, and runs as a task; a factory task gives a `reference` to a pull request, changes the repository `target` with its `own` credential, spends, and is a task; an orchestrator gives `derived` from what it read by calling back, may reach out, spends, and is a task; a notifier gives a `reference` and reaches out.

### Declarations that do not fit together are refused

The describe answer is refused, whole, when: an operation is listed twice or takes a reserved name; an example names an unlisted operation; a service with a task gives no reporting interval or does not answer `status` and `cancel`, or a service with none gives an interval or task calls; an input schema is not an object schema with `additionalProperties: false`, holds any top-level keyword but `type`, `properties`, `required`, `additionalProperties`, `title` and `description` (a `patternProperties`, `$ref` or `allOf` could admit arguments the checker never sees), or has a `required` that is not a list of properties it lists; an operation lists input properties without taking `args`, or takes `args` and lists none; `kinds` is given other than exactly for `records`; `target` is given other than exactly for `changes: target`, or names a field the input does not list and require, or one that is not a typed id (a string with a `pattern` anchored by `^` and `$` and a `maxLength` of at most 256, or an object of nothing but required ones). Within that, what the pattern admits is the service's word: Station checks that it bounds the whole string, not that it is narrow. A host is a value, never fixed by the contract; an operation gives `derived` and neither takes `handed` nor calls back; `spends.reports` does not match `runs`.

## Answers

An operation that runs now answers `{ contract, operation, simulated, result, spend? }`, where `result` is one of:

```
{ "gives": "nothing" }
{ "gives": "records", "records": [ { "ref", "kind", "updated_at", "mapping_version", "fields": { "<name>": { "kind": "<field kind>", "value": <any JSON> } } } ], "next_cursor": null | "<cursor>" }
{ "gives": "derived", "derived": [ { "from": [ { "docking", "ref" } ], "content": { ... } } ] }
{ "gives": "reference", "reference": { "kind": "pull_request", "id": "<token>", "link": null | "<https link>" } }
```

A fast operation pages its records with `next_cursor` in the same answer; only long work is a task. An operation that runs as a task answers `{ contract, operation, simulated, task: { id, state: "accepted" | "already_started" } }`. Any call may answer the shared [error answer](errors.md) instead.

Field kinds are `text`, `number`, `boolean`, `datetime`, `id`, `link`, `name`, `email`, `phone`, `address`, `money` and `other`. Station may withhold a field by its kind; it never reads a value.

### An answer that does not fit its declaration is refused

Whole, never trimmed, when it is for another operation; it answers a task for an operation that runs now, or a result for one that runs as a task; its `gives` is not the one declared (records from an operation that gives back nothing, a reference from a read); a record is of an undeclared kind or a ref repeats; a derived entry names an item Station did not hand over in this call (for an operation that calls back: did not hand it under this call), or names one twice; `spend` is given by an operation that spends nothing, or left out by one that spends. `null` spend means unpriced, never zero.

Of a record, Station reads `ref`, `kind`, `updated_at` and `mapping_version`, and nothing else. A record with any other key at that level is refused; its `fields` are carried exactly, bounded to 64 fields and 16384 UTF-8 bytes, and never interpreted, whatever their names or values.

## Task status

`status`, arguments `{ "task": "<id>" }`, answers:

```
{ "contract": "station/service@1", "operation": "<name>", "task": "<id>", "simulated": false,
  "state": "queued" | "running" | "waiting" | "succeeded" | "failed" | "cancelled" | "timed_out",
  "updated_at": "<datetime>",
  "steps": [ { "id", "parent": null | "<earlier step id>", "label", "state": "waiting" | "running" | "done" | "failed" | "skipped",
               "started_at", "duration_ms", "spend"?, "waiting_on": null | "approval" | "input" | "review",
               "failure": null | "<code>", "has_content": true } ],
  "decisions": [ { "kind": "selected" | "ranked" | "skipped" | "excluded" | "escalated" | "gave_up" | "retried",
                   "about": [ { "docking", "ref" } ], "outcome": null | "<code>", "step": null | "<step id>" } ],
  "spend"?: null | { "amount", "unit": "usd" },
  "failure": null | "<code>",
  "result": null | <a result, as above> }
```

`status` may answer the shared error answer too, read as one, not as a broken status. A step's `label` is one line.

Failure codes are `timed_out`, `budget_exceeded`, `cancelled`, `input_invalid`, `forbidden`, `not_found`, `tool_failed`, `model_failed`, `unavailable` and `internal`: a code, never message text. A status holds labels, numbers and references only; a step's reasoning and content stay with the service.

A status is refused when it is for another task; a step id repeats or a parent does not come before its step; a step or the task has a failure code other than exactly when it failed; a step waits on a person while not waiting, or a waiting task has no such step; it has a result other than exactly when it succeeded, or one that does not fit the declaration, or records with a `next_cursor` (a task's records come whole); a decision names a step not reported or an item Station did not hand over; spend is given or left out against the declaration.

## What stays a claim

A declaration is the service's word. Station checks every answer that passes through it against it, as above. What a service does inside, and above all what it does with a credential of its own (`credential: own`), Station cannot see: it can refuse the call, and verify what comes back, but not what the service did with the credential. That is shown in plain words when the service is docked. The amount spent is the service's claim too.

## Cancel and content

`cancel`, arguments `{ "task": "<id>" }`, answers `{ contract, operation, task, state: "cancelling" | "cancelled" | "finished" }`: stopping, stopped, or already ended with nothing stopped. Station reads `status` for how it ended.

`content`, offered only by a service whose `task_calls` lists it, arguments `{ "task": "<id>", "step": "<step id>" }`, answers `{ contract, operation, task, step, kept: true, content: { ... } }` (at most 65536 UTF-8 bytes), or `{ contract, operation, task, step, kept: false }` when the service no longer keeps it. Either is refused when it is for another task or step. Both may answer the shared error answer.

## The call envelope

Every request carries a bearer token Station signed for this one service, minted fresh (`../reference/connector-token.ts` is how a service checks it: Station's public key set, issuer, its own URL as audience, two minutes at most, never twice). Every `tools/call` carries `_meta`:

| Key | What |
|---|---|
| `station/request` | on an operation: 64 lowercase hex, the caller's own request id hashed with the caller, the docking and the operation. A retry of one call carries the same value. A service answers a value it has seen with the task it started (`already_started`), never a second task |
| `traceparent` | Station's span for this call, a child of the caller's; the same as the `traceparent` header |
| `station/run`, `station/session`, `station/parent` | the caller's own ids, where it named them |

Each request is sent in a session whose `station_describe` answered at the config hash and model the docking pinned, and whose whole answer has the digest the docking pinned (its canonical JSON); otherwise nothing else is sent. A service that changes any declaration while keeping its config hash is not the service docked.

## What Station does before and after a task call

- **A retry.** The same request id with the same arguments answers the task it started, from the ledger, without calling the service. The same id with other arguments than any earlier call under it, started, refused or of unknown outcome, is refused (`request_conflict`). An agent acting for no owner is refused. A start whose outcome could not be told is sent again with the same `station/request`.
- **A target.** For an operation that changes `target`, the input's target field must fit its declared type (each string its pattern, read as anchored whole, and length; an object exactly its declared strings) and be one the ledger can keep, or it is refused (`target_invalid`, `target_missing`). The core then decides whether the caller is granted it, and for an agent whether its owner is too; the decisions are recorded before the call, and a deny for either is refused (`target_not_granted`). Nothing is sent to the service in any of these.
- **Who may follow a task.** The account that started it, or the owner of the agent that did. A step's content is read by a person only, and only for a step a status reported.
- **Stale.** When Station reads a task's status and the task has not reported for two of its intervals (its `updated_at`, never later than Station's clock, is older than that; or Station could not read a status, the last report is older than that, and reads have failed for at least one interval, not counting a call Station never sent or a retryable error answer), the task is stale. That is recorded, and it stays stale: every further `status`, `content` and an agent's `cancel` under it is refused, and nothing is sent. A person who may follow it can still cancel it. A task Station is not asked about is not judged, and a finished task is never stale.

## What the ledger keeps of a task

One entry per thing Station saw or did: a start (or a start refused, or one whose outcome is unknown), a status read when it changed and at least once an interval, a cancel, the task found stale, a content view. An entry holds ids, the task's and steps' states, step labels, decision kinds with the refs of the handed items they were about and their outcome codes, spend (`unpriced` when the service could not price it), failure and refusal codes, the request id and the arguments' digest, the target and the decisions it rested on, and the trace. Never the arguments, a step's duration or content, or anything the service wrote beyond a one-line label: the ledger refuses an entry with any other field. A content view records who read which step of which task, when, under which trace, and whether it was kept; the content goes to the person and nowhere else, and a view the ledger will not take hands nothing over.

Not here yet: operations that run now through this client, arguments checked against an input schema beyond the target, the reach-out rule before a call, calls back into Station named by their task, and the ledger's record of an operation's declared and observed effects. Those come as the services move onto this contract.
