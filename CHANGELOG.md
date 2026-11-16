# Changelog

## station 2.0.0

- Contract schema `describe-v1.schema.json` removed.
- Contract schema `describe-v2.schema.json` removed.
- Contract prose `errors.md` reworded.
- Contract schema `errors.schema.json` changed.
- Contract schema `factory-v2.schema.json` removed.
- Contract schema `harness-v1.schema.json` removed.
- Contract schema `harness-v2.schema.json` removed.
- Contract prose `service-v1.md` reworded.
- Contract schema `service-v1.schema.json` changed.
- Contract schema `source-v1.schema.json` removed.
- Contract schema `source-v2.schema.json` removed.
- `station-factory`: SKILL.md reworded.
- `station-service`: SKILL.md reworded.
- Decided by hand: contract file describe-v1.md was removed: say what it means for a service; published as major.
- Decided by hand: contract file describe-v2.md was removed: say what it means for a service; published as major.
- Decided by hand: contract file factory-v2.md was removed: say what it means for a service; published as major.
- Decided by hand: contract file harness-v1.md was removed: say what it means for a service; published as major.
- Decided by hand: contract file harness-v2.md was removed: say what it means for a service; published as major.
- Decided by hand: contract file source-v1.md was removed: say what it means for a service; published as major.
- Decided by hand: contract file source-v2.md was removed: say what it means for a service; published as major.
- Decided by hand: prompt station/ask-for-access.md changed beyond its wording; published as major.
- Decided by hand: station-factory's frontmatter metadata.version changed; published as major.
- Decided by hand: station-service's description changed: patch if it still triggers on the same requests, major if it does not; published as major.
- Matches Station release `main-6ff2886a7610`.

## station 1.3.0

- Decided by hand: contract file service-v1.md was added: say what it means for a service; published as minor.
- Decided by hand: contract schema service-v1.schema.json is new: minor if no service must change for it, major if one must; published as minor.
- Matches Station release `main-b33cdc946d04`.

## station 1.2.0

- Contract prose `factory-v2.md` reworded.
- Prompt `station/ask-for-access.md` reworded.
- New prompt `station/build-a-ticket.md`.
- Prompt `station/whats-waiting.md` reworded.
- New skill `station-agent`.
- New skill `station-factory`.
- `station-service`: SKILL.md reworded.
- Matches Station release `main-1aeffae0ce66`.

## station 1.1.0

- New prompt `station/ask-for-access.md`.
- New prompt `station/check-my-service.md`.
- New prompt `station/dock-my-service.md`.
- New prompt `station/find-a-tool.md`.
- New prompt `station/stop-something-now.md`.
- New prompt `station/what-can-i-do.md`.
- New prompt `station/whats-waiting.md`.
- New prompt `station/who-has-access.md`.
- Matches Station release `main-a24708cfec5d`.

## station 1.0.0

- `station-service`: build, check and dock a source, harness or factory; the contracts (describe@1/@2, source@1/@2,
  harness@1/@2, factory@2, errors) as prose and JSON Schema; the token-check reference.
- Matches Station release `main-77dc294fe20c`.
