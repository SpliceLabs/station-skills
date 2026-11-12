# Versioning

Each pack has one SemVer version. No standard says what a breaking change to a skill is, so this file does.

| Bump | When |
|---|---|
| Major | A changed skill name, required input or output shape; removed behaviour; wider tool access; a trigger change that fails the old evals; a contract change a service must follow |
| Minor | A new skill or capability, or a deprecation |
| Patch | Wording that passes the existing evals |

Skill names never change. A retired skill is listed in `retired-skills.json` with its replacement.

A release is tagged `<pack>-v<version>`, for example `station-v1.0.0`. A Station adopts a skill at a commit, so a
version reaches nobody until an administrator proposes it and a second confirms it.
