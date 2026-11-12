# station-skills

Public skills for working with Splice Station: how to build a service Station can dock, check it, and propose it. They are
written for an assistant to follow, in the Agent Skills format (`SKILL.md`), and any MCP client can use them.

| Pack | Skill | What it is for |
|---|---|---|
| `station` | [`station-service`](station/station-service/SKILL.md) | Build a source, harness or factory that Station can dock, check it with `station_check_service`, and propose it with `station_propose_docking` |

Also here, because a builder needs them:
- [`contracts/`](contracts/): every contract a docked service speaks, in prose (`*.md`) and as JSON Schema (`*.schema.json`).
- [`reference/connector-token.ts`](reference/connector-token.ts): Station's own check of the token it signs for a service.

## How a skill reaches an assistant

A Station adopts a skill from this repository at one exact commit: one administrator proposes it, a second confirms it,
and an administrator grants it to people. Station then serves exactly that version, checked against its hash, and
records each read. A new release here changes nothing for anyone until it is adopted again.

## Where these are written

They are written and tested in Station's own repository, where every example in a skill is checked against the real
contracts, and published here with each Station release. Change them there, not here.

See [`VERSIONING.md`](VERSIONING.md) for what a version means and [`CHANGELOG.md`](CHANGELOG.md) for which Station
release each version matches.
