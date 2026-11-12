# Error answers for the `@2` contracts

What a docked service that speaks [`station/source@2`](source-v2.md) or `station/harness@2` answers, in place of a result, when it did not do what it was asked. The code that reads it is `src/docking/error-codes.ts`, which a service vendors a copy of; the JSON Schema is [`errors.schema.json`](errors.schema.json). It is generated from that code by `bun run contracts:schemas`, and Station checks some rules beyond it, which the schema's `description` lists. The decision behind it is docked services may speak the @2 contracts beside @1.

The `@1` contracts do not use it: they keep their `refused:` and `unavailable:` tool-error prefixes, unchanged ([`source-v1.md`](source-v1.md#failures)).

## Shape

An error answer is the tool's ordinary result, carrying `error` and nothing else:

```json
{ "error": { "code": "rate_limited", "retryable": true, "retry_after_ms": 2000, "fix_hint": "Slow down to one call a second." } }
```

- `code` is one of the codes below. Any other code is refused.
- `retryable` is the code's, not the service's to choose: `true` for `rate_limited` and `unavailable`, `false` for every other code. An answer that says otherwise is refused.
- `retry_after_ms` is optional, a whole number of milliseconds from 0 to one day, and only on a retryable code. On any other code it is refused.
- `fix_hint` is at most 500 bytes, UTF-8, and may be empty. It may hold a plain newline, but no other C0 or C1 control character (such as ESC or a tab) and no bidi mark, embedding, override or isolate (such as U+202E), since a hint is shown to people as it was written.
- An extra or missing field, or a result field such as `contract` beside `error`, is refused.
- An answer nested too deep to parse safely, or holding a `__proto__`, `constructor` or `prototype` key, is refused before it is parsed.

A refusal names the rule and the contract field, never a key or value the service wrote.

## Codes

| Code | Retryable | Meaning |
|---|---|---|
| `not_found` | no | What the call named does not exist at the source. A `source_read` names refs it does not have in `missing` instead. |
| `rate_limited` | yes | The service, or the system behind it, is limiting calls. |
| `auth_expired` | no | The service's own access to the system behind it has expired. Someone has to sign it in again. |
| `forbidden` | no | The service's access does not cover what was asked. |
| `bad_cursor` | no | A cursor or `since` the service does not accept, for example one that has expired. |
| `unsupported` | no | The service does not offer what was asked, for example `source_search` from a source that does not list it. |
| `unavailable` | yes | The service, or the system behind it, could not be reached, and nothing was done. |
| `invalid_request` | no | The arguments were well formed but the service will not act on them. |

## What Station does with one

Station reads the code, whether it is retryable, `retry_after_ms`, and the hint. **Only the code is meant to be recorded.** The hint is the service's own words: it is handed on to the caller labelled as the service's (`hint: { from: "service", text }`), never read by Station, and never recorded, since a service can write anything in it.

**Station never retries.** Whether to try again, and when, is the caller's: Station passes `retryable` and `retry_after_ms` on.
