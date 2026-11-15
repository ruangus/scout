# scout

[![License][license-src]][license-href]

Read-only snapshots of GitHub repositories for coding agents, so they read a library's **source** instead of answering from memory.

```bash
scout add https://github.com/effect-ts/effect --tag effect@4.1.4
```

## Why

An agent asked how a library behaves answers from what it learned in training, and that is often an older version. The source at the exact branch, tag, or commit you depend on is the canonical answer. Scout fetches it in one command, keeps it on disk, and ships a skill that tells the agent when to reach for it.

- **No git needed**: snapshots come from GitHub tarballs over HTTP
- **Pinned**: every revision lives at its own immutable path
- **Agent-shaped output**: JSON on stdout, tagged errors on stderr
- **Fresh enough**: branches refresh on demand, after a one-hour TTL

## Install

Requires [Bun](https://bun.sh) 1.4 or newer.

```bash
git clone https://github.com/ruangus/scout
cd scout
bun install
bun link
```

Then teach your agents to use it:

```bash
scout skill install
```

It writes the skill to `~/.agents/skills/scout` and links it from `~/.claude/skills/scout`. Run it again after upgrading to keep the skill in step with the CLI.

## Usage

### `scout add <github-url>`

Downloads a snapshot. Pick at most one of `--branch <name>`, `--tag <name>`, or `--commit <sha>`; with none, scout selects the default branch.

```bash
scout add https://github.com/effect-ts/effect
scout add https://github.com/effect-ts/effect --tag effect@4.1.4
```

```json
{
  "_tag": "Downloaded",
  "snapshot": {
    "repository": { "owner": "effect-ts", "name": "effect" },
    "selection": { "_tag": "Tag", "name": "effect@4.1.4" },
    "sha": "289a53f7b1fc40049219c6e69022db2fb859c356",
    "path": "~/.scout/github.com/effect-ts/effect/tag/effect%404.1.4/289a53f7b1fc40049219c6e69022db2fb859c356",
    "fetchedAt": "2026-11-15T18:00:00.000Z"
  }
}
```

Adding a selection that is already cached returns `AlreadyCached`. With an explicit selector, that answer comes straight from disk; without one, scout first asks GitHub which branch is the default.

### `scout list [query]`

Lists the newest snapshot of each cached selection. The query matches `owner/repo`, case-insensitive.

```bash
scout list effect
```

### `scout update <owner/repo>`

Refreshes the cached branches of a repository. Each result is `Fresh` (checked within the last hour, left as is), `Unchanged` (still at the same commit), or `Updated` (a new revision at a new path). Tags and commits never change.

```bash
scout update effect-ts/effect
```

### `scout remove <owner/repo>`

Removes one selection with `--branch`, `--tag`, or `--commit`, or the whole repository without a selector.

```bash
scout remove effect-ts/effect --tag effect@4.1.4
```

### `scout skill install`

Installs or refreshes the agent skill. It never overwrites something else already at `~/.claude/skills/scout`.

## Errors

A failing command prints one JSON object on stderr and exits with code 1:

| `_tag` | Meaning |
| --- | --- |
| `RepositoryNotFound` | The repository does not exist, or it is private and `GITHUB_TOKEN` is unset |
| `RefNotFound` | The repository exists, the branch, tag, or commit does not |
| `RateLimited` | The GitHub API quota is spent; `resetAt` says when it returns |
| `RemoteUnavailable` | GitHub could not be reached or answered unexpectedly |
| `ReadFailed` / `WriteFailed` | The cache directory could not be read or written |
| `SkillConflict` | Something other than the scout skill sits at the skill link path |

## Configuration

| Variable | Default | Purpose |
| --- | --- | --- |
| `SCOUT_HOME` | `~/.scout` | Where snapshots live |
| `GITHUB_TOKEN` | | Raises the GitHub rate limit from 60 to 5,000 requests an hour, and reaches private repositories |

## How it works

Snapshots live at `$SCOUT_HOME/github.com/<owner>/<repo>/<branch|tag|commit>/<ref>/<sha>`, each with a `.scout.json` describing it. A download extracts into a staging directory and moves into place with an atomic rename, so an agent never reads a half-written snapshot. Built with [Effect](https://effect.website).

## License

[MIT](./LICENSE) License © 2026-PRESENT [Ruan Gustavo](https://github.com/ruangus)

<!-- Badges -->

[license-src]: https://img.shields.io/github/license/ruangus/scout?style=flat&colorA=080f12&colorB=1fa669
[license-href]: https://github.com/ruangus/scout/blob/main/LICENSE
