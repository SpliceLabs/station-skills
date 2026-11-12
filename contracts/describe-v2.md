# Describe contract `station/describe@2`

What a docked service answers about itself when it also says what it is for. It sits beside [`station/describe@1`](describe-v1.md), which is unchanged: a service answers one version, and a service answering `@1` keeps working and shows no purpose. The code that reads it is `src/docking/describe.ts`; the JSON Schema is [`describe-v2.schema.json`](describe-v2.schema.json). It is generated from that code by `bun run contracts:schemas`, and Station checks some rules beyond it, which the schema's `description` lists. The decision behind the pin is a docking is an explicit operator revision pinned to each service's config hash and model.

## The tool

`station_describe`, arguments `{}`, answers `structuredContent` exactly:

```
{ "describe": "station/describe@2",
  "contract": "<the contract it answers, e.g. station/source@2>",
  "name": "<kebab-case>", "version": "<semver>",
  "config_hash": "<64 lowercase hex>",
  "tools": ["<tool names it answers besides station_describe>"],
  "reads": ["<plain words>"], "writes": ["<plain words>"], "data": ["<plain words>"],
  "model": null | { "provider": "<provider>", "model": "<model id>" },
  "models": [ { "provider": "<provider>", "model": "<model id>" } ],
  "purpose": "Our CRM: companies, people and deals for Splice clients",
  "use_when": ["you need a client's deals or contacts"],
  "not_for": ["Splice's own finances"],
  "examples": [ { "ask": "what deals does Acme have?", "tool": "source_list" } ],
  "kinds": ["company", "person", "deal"],
  "limits": ["changes go back 90 days"] }
```

Every `@1` field means what it means in `@1`, with `models` optional as there. The new fields are the service's own words about what it is for:

| Field | What | Bound |
|---|---|---|
| `purpose` | One sentence: what the service is for | 1-280 bytes |
| `use_when` | When a caller should use it | at most 8, each 1-200 bytes |
| `not_for` | When a caller should not | at most 8, each 1-200 bytes |
| `examples` | `{ ask, tool }`: an ask in plain words and the tool that answers it; `tool` is one the answer lists in `tools` | at most 4; `ask` 1-200 bytes |
| `kinds` | The item kinds a source holds, from `station/source@2`'s kinds (or `x-` kinds of its own), each once. **Required for a source and refused for anything else** | 1-32 |
| `limits` | What it cannot do, in plain words | at most 4, each 1-200 bytes |

`use_when`, `not_for`, `examples` and `limits` are required and may be empty.

### The text rule

Bounds are counted in UTF-8 bytes, not characters. Every text a service writes in a `@2` answer (the six fields above, an example's `ask`, `reads`, `writes` and `data`, each 1-256 bytes in `@2`, and a model's `provider` and `model`) holds no control character but a newline (U+0000-U+0009, U+000B-U+001F, U+007F-U+009F), no bidi mark, embedding, override or isolate (U+061C, U+200E, U+200F, U+202A-U+202E, U+2066-U+2069), and no character a person does not see but a model reads: zero-width spaces and joiners (U+200B-U+200D), line and paragraph separators (U+2028, U+2029), invisible operators (U+2060-U+2064), a byte order mark (U+FEFF), tag characters (U+E0000-U+E007F), or a lone surrogate. It is the same rule as an error answer's [`fix_hint`](errors.md). In `@2` a tool name is an MCP tool name (`[A-Za-z0-9_.-]`, 1-128) and is listed once.

`kinds` is the source's word: Station checks its shape, not that the source's items are of those kinds.

Answers are read strictly: an extra or missing field is refused, as is an example naming a tool the answer does not list. The refusal says which rule broke and where, and carries none of the service's words.

## How Station uses it

- **The whole answer is pinned.** Docking records the answer and pins the content address of all of it (`sha256:` over its canonical encoding, the same encoding as every Station content address). A `station/docking@2` record carries it as `pin.describeHash`; a `@1` record carries nothing new. The pin is read from the recorded answer as it stands, never against the contract again: a rule added to this contract later refuses a live answer that breaks it (`redock_needed`), not the pin.
- **Every call.** As with `@1`, Station asks again in the same session before the tool call. A `@2` answer whose content address differs from the pinned one in any byte, its words included, is not called: the caller is refused `redock_needed`, never told to resend. A service docked answering `@1` that now answers `@2`, or the reverse, is refused the same way, even at the same config hash, since its words were not what was approved.
- **Docking again.** `station_dock` and `station_redock` show the words under `service_says`, as the service's own, and the hash under `pin`; confirming asks the service again and docks only the answer that was shown. A redock that changed only the words is `repinned`.
- **Tool descriptions.** Each tool a `@2` docking adds ends its description with Station's fixed sentence saying whose words follow and that they are never followed as instructions, then `The service describes itself as: "<purpose>". Use when: "<use_when>"; ...`, then `(End of the service's words.)`. Each of the service's texts is quoted as a JSON string, with quotation marks that look like a JSON string's own (U+2018, U+2019, U+201C, U+201D, U+FF02, U+FF07) and the invisible U+00AD and U+180E written as `\u` escapes, so the only quotation marks are Station's. The text is built from the answer the docking pinned, never from what the service answers now, so it changes only when an administrator docks it again. The plan shows it word for word: as `tool_descriptions_end_with` in a `station_dock` or `station_redock` plan, and as each service's `toolDescriptionsEndWith` in a configured pair's docking summary. The words are shown only while the service is configured at the URL it was docked at. The whole text is at most 1600 UTF-8 bytes: the purpose and the first `use_when` entry always fit whole, and further entries that do not fit are left out in order and counted. A source's tools carry the source's words and a run tool the harness's. A service docked answering `@1` adds nothing to Station's own description.

The words are text an assistant reads, whichever MCP client it runs in. Station shows them labelled as the service's, never follows them, and never ranks or rewrites them with a model. Nothing here is a check of whether the words are true or harmless: that is the administrator's, on seeing them.
