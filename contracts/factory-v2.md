# `station/factory@2`

What a docked software factory answers: the only shape Station accepts from it. A factory writes code: given a repository and a brief, it plans, codes and tests, and opens a pull request, under its own rules and the code host's. Station decides who may start a task on which repository, records each call, and reads back what the factory says about the task. It never drives the factory's internals, and never opens, approves or merges a pull request itself. The code that reads it is `src/docking/factory-contract.ts`, which the factory connector in `connectors/factory/` imports directly; Station reaches it through `src/docking/factory-connector.ts`. The JSON Schema is [`factory-v2.schema.json`](factory-v2.schema.json), each tool's arguments and answer under `$defs`. It is generated from that code by `bun run contracts:schemas`, and Station checks some rules beyond it, which the schema's `description` lists.

Every factory also answers [`station/describe@1`](describe-v1.md), declaring in `writes` what it changes (its branches and pull requests) and in `models` every model a caller may choose, and is called only at the config hash, models and writes a docking pinned.

## Tools

A token is `^[A-Za-z0-9][A-Za-z0-9._:-]{0,127}$`. A **repository** is `{ "host": "github.com", "id": "<the host's numeric id>" }`, never a name: a renamed or transferred repository keeps its id, and a name can later point elsewhere.

### `factory_identity`

Arguments: `{}`. Answer: `{ "contract": "station/factory@2", "factory": { "id": "<what this factory answers for, 1-256 chars>" } }`.

### `factory_task_start`

Arguments:

```json
{
  "key": "<Station's idempotency key, one token>",
  "repository": { "host": "github.com", "id": "830421337" },
  "brief": "<what to build, 1-8000 characters>",
  "ticket": { "source": "<a configured source, such as github or jira>", "id": "<one token>" },
  "limits": { "wallClockSeconds": 60-86400, "maxSpendUsd": "> 0, at most 1000" },
  "startedBy": "<the account Station decided for>",
  "model": { "provider": "<provider>", "model": "<model>" }
}
```

`ticket` is optional and a reference only: a source is a name the deployment configures (`^[a-z][a-z0-9-]{0,31}$`), so a new tracker is configuration, not a contract change. Station also sends `local`, for a ticket kept as a file in the asker's own checkout, with the id `<feature>:<number>`; the factory cannot read it, so its brief carries the work whole. `model` is optional and must be one the factory's describe answer lists in `models`; without it the factory uses its default. `limits` is required: Station never asks for a task without a bound on time and spend. The factory acts as itself; `startedBy` says who asked.

Answer: `{ "contract", "factory", "simulated", "task": { "id": "<token>", "state": "accepted | already_started" } }`. A factory starts nothing for a key it has seen: it answers `already_started` with the first task's id.

### `factory_task_inspect` and `factory_task_cancel`

Arguments: `{ "taskId": "<token>" }`.

Inspect answers `{ "contract", "factory", "simulated", "task": Task }`; cancel answers `{ "contract", "factory", "task": { "id", "state" } }`. Either answer must be about the task asked for.

### `factory_tasks_list`

Arguments: `{ "cursor"?: "<from the previous page>" }`. Answer: `{ "contract", "factory", "simulated", "tasks": [Task, at most 50], "next": "<cursor> | null" }`, no task twice.

### Task

| Field | Value |
|---|---|
| `id` | one token |
| `state` | `queued`, `running`, `succeeded`, `failed`, `cancelled` or `timed_out` |
| `repository` | as above |
| `startedBy` | the account Station sent |
| `model` | `{ "provider", "model" }` the task runs on, or `null` until the factory can say |
| `pullRequest` | `{ "number": <positive>, "headSha": "<40 hex>" }` once one is open, else `null` |
| `spentUsd` | what the task has spent, as the factory reports it, or `null` |
| `startedAt`, `updatedAt` | ISO 8601 date-times |

Station refuses, never trims: an extra or missing field anywhere, a `contract` other than `station/factory@2`, a repository given by name, an unknown state, a pull request whose head is not a commit, an answer about another task than the one asked, or a list naming a task twice.

## How Station calls it

Station docks a factory as its own governed revision, either from an MCP client (`station_dock`, confirmed by an administrator, as a source or a harness is) or from its configuration, and offers its tools to the people and agents granted it (`<factory>_start_task`, `<factory>_task`, `<factory>_cancel_task`, `<factory>_my_tasks`). The core decides each call as the caller and records it. Before a start reaches the factory, Station checks the repository against the caller's list (for a factory docked from an MCP client, the repositories an administrator granted them by id with `station_grant_access`, recorded in Station's ledger; for a configured one, the configuration's), an agent's narrowed to its owner's, the limits against the factory's caps, the model against the pinned list and the ticket source against the configured sources. The `key` it sends is derived from the deployment, the factory, the caller and the caller's own retry key, so two callers never share a key. `startedBy` is the account the core decided for, never anything the caller says. Station asks to inspect or cancel only a task its ledger records as started by the caller, refuses an inspect answer whose `startedBy` is someone else or whose `model` is not the one the caller chose, and shows a caller only the listed tasks whose `startedBy` is theirs. The brief goes to the factory and is not kept in Station's ledger.

## Failures and authentication

Exactly as [`station/source@1`](source-v1.md): a tool error starting `refused:` is the factory answering no, `unavailable:` is nothing done, and anything else, a timeout or a dropped connection after sending is an unknown outcome. Every call carries a token Station signs for this factory alone (`typ` `station-harness+jwt`, audience the factory's own URL, at most 120 seconds), which the factory checks and remembers so a copied token is refused.

## Versioning

A breaking change is `station/factory@3`, docked as a new service. `@2` added `model`, and made a ticket's source a configured name. Nothing was ever docked at `@1`.
