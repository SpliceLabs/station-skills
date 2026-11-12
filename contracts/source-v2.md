# `station/source@2`

What a docked source that speaks the second version answers: the only shape Station accepts from it. It sits beside [`station/source@1`](source-v1.md), which is unchanged; a source answers one version, and a docking names which. The code that reads it is `src/docking/source-contract-v2.ts`, which a source vendors a copy of; the JSON Schema is [`source-v2.schema.json`](source-v2.schema.json), each tool's arguments and the one answer under `$defs`. It is generated from that code by `bun run contracts:schemas`, and Station checks some rules beyond it, which the schema's `description` lists. The decision behind it is docked services may speak the @2 contracts beside @1. Every source also answers [`station/describe@1`](describe-v1.md) with `contract: "station/source@2"`, is called only at the config hash and model a docking pinned, and authenticates Station exactly as an `@1` source does ([`source-v1.md`](source-v1.md#authentication)).

The second version is for a source that fronts a system of record with many kinds of thing in it, such as a CRM or a knowledge base: one contract, whatever is behind it. It reads items by reference, pages, follows changes, and may search.

## What Station reads

Of an item, Station reads **only `ref`, `kind`, `updated_at` and `mapping_version`**. It reads `ref` to check an answer answers the call it made and to tie a harness's output to an item it handed over; `kind` to check a list or search answered the kind asked for; `updated_at` and `mapping_version` to say which version of an item, produced by which mapping, a decision was about. `remote_id`, `link`, `fields` and `raw` are carried and bounded, never interpreted: what a deal, a stage or a page means is the source's and the harness's.

## Tools

A source offers `source_read`, `source_list` and `source_changes`. `source_search` is optional: a source offers it by listing it in its describe answer's `tools`, and `offersSearch` in the contract file tells, from a describe answer, whether it does.

| Tool | Arguments |
|---|---|
| `source_read` | `{ "refs": [ref, ...] }`, 1-50 refs, each once |
| `source_list` | `{ "kind"?: kind, "limit": 1-50, "cursor"?: cursor }` |
| `source_changes` | `{ "since": cursor \| null, "limit": 1-50 }`; `null` reads from the start of what the source keeps |
| `source_search` | `{ "query": "1-256 bytes, not blank", "kind"?: kind, "limit": 1-50, "cursor"?: cursor }` |

A cursor is a string of 1-1024 bytes, UTF-8, that is the source's own; Station passes it back and never reads inside it.

## Answer

Every tool answers the same shape:

```json
{
  "contract": "station/source@2",
  "source": { "id": "<what this source answers for, 1-256 bytes>" },
  "simulated": false,
  "items": [{
    "ref": "<one token>",
    "kind": "company",
    "remote_id": "<the remote system's id, 1-256 bytes>",
    "updated_at": "2026-11-01T12:00:00Z",
    "link": "https://crm.example.com/companies/42",
    "mapping_version": "<sha256 hex of the mapping, or null>",
    "fields": { "...": "any JSON" },
    "raw": { "...": "any JSON, optional" }
  }],
  "next_cursor": "<where the next page starts, or null>",
  "missing": []
}
```

- `ref` is `^[A-Za-z0-9][A-Za-z0-9._:-]*$`, at most 256 bytes: Station's handle for the item, stable for as long as the item exists. Refs are case-sensitive: `C-1` and `c-1` are two items. A source over a system that ignores case must normalise its refs, or one record will reach Station as two.
- `kind` is one of `company`, `person`, `deal`, `stage`, `note`, `task`, `space`, `page`, `comment`, or a kind of the source's own: `x-` and a lowercase slug, such as `x-renewal-window`, at most 64 characters.
- `updated_at` is an RFC 3339 timestamp with a `Z` or an offset.
- `link` is where a person can open the item, or `null`: at most 2048 bytes, starting `https://` in lowercase, then a host, with no userinfo (`user:pass@`), no whitespace or backslash, and never `localhost` or a loopback, private, link-local or other non-public address literal.
- `mapping_version` is the sha256 of the mapping that produced the item from the remote record, or `null` for a source with no mapping.
- `fields` and `raw` are any JSON objects of at most 16 KiB each, serialized as UTF-8, nested at most 32 deep, with keys of 1-128 characters and no `__proto__`, `constructor` or `prototype` key anywhere. `raw` may be left out.
- `next_cursor` is where the next page starts, or `null` when there is none. For `source_changes` it is what to pass as `since` next time. A read has no next page: it is always `null`.
- `missing` is for `source_read` only: refs asked for that the source does not have. Every ref a read asked for is in exactly one of `items` and `missing`. Every other tool answers `[]`.
- `simulated: true` says the data is not live, and travels with every answer.

## What Station refuses

Station refuses the whole answer, never trims it, when:

- a field is extra or missing, anywhere, or a value is outside its shape above;
- the `contract` is another version;
- there are more items than the call allowed: `limit`, or for a read the number of refs asked for;
- a ref appears twice among the items, or twice in `missing`;
- `fields` or `raw` is over 16 KiB or nested deeper than 32, or the cursor is over 1024 bytes;
- a `__proto__`, `constructor` or `prototype` key appears anywhere, or the whole answer is nested too deep to parse safely: both are refused before parsing;
- a link is not a lowercase `https://` URL to a public host, or carries userinfo;
- a list or search that named a `kind` gets an item of another kind;
- a read answer returns an item, or names a missing ref, that was not asked for;
- a ref is both returned and `missing`, or a ref a read asked for is neither;
- a read answer has a `next_cursor`;
- any tool but `source_read` answers with `missing` refs.

A refusal names the rule, the contract field and an item's position, never a ref, a key or a value the source wrote, since the reason is passed on and recorded.

`readSourceReply` in the contract file reads a reply against the call it answers.

Every length bound in this contract counts UTF-8 bytes, not characters.

## Failures

A source that did not do what it was asked answers the shared [error answer](errors.md), `{ "error": { "code", "retryable", "retry_after_ms"?, "fix_hint" } }`, in place of a result. It is read as strictly as an answer: an unknown code, a retryable flag the code does not have, or an error beside result fields is refused. `readSourceReply` reads either. Anything else that goes wrong after the call was sent, such as a timeout or a dropped connection, is an unknown outcome, as for [`station/source@1`](source-v1.md#failures).

## Versioning

A change that would make an old answer invalid, or an old source unable to answer, is a new version, `station/source@3`.
