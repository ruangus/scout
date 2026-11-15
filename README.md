# scout

[![License][license-src]][license-href]

Give your coding agent the real source code of the libraries you use, at the exact version you depend on.

## Why

Agents answer library questions from their training data, which lags behind the code you actually run. With scout, the agent fetches the library's source at the branch, tag, or commit you care about and reads it, instead of guessing.

You rarely run scout yourself: the bundled skill tells your agent when and how.

## Install

Requires [Bun](https://bun.sh) 1.4 or newer.

```bash
git clone https://github.com/ruangus/scout
cd scout
bun install
bun link
scout skill install
```

`scout skill install` adds the skill to `~/.agents/skills` and `~/.claude/skills`. Run it again after upgrading.

## Usage

```bash
scout add https://github.com/effect-ts/effect                      # default branch
scout add https://github.com/effect-ts/effect --tag effect@4.1.4   # or --branch, --commit
scout list effect                                                  # what is cached, and where
scout update effect-ts/effect                                      # refresh cached branches
scout remove effect-ts/effect --tag effect@4.1.4                   # drop a snapshot
```

Run `scout --help` for every option.

## Configuration

Set `GITHUB_TOKEN` to reach private repositories and raise GitHub's rate limit. Snapshots live in `~/.scout`; set `SCOUT_HOME` to keep them elsewhere.

## License

[MIT](./LICENSE) License © 2026-PRESENT [Ruan Gustavo](https://github.com/ruangus)

<!-- Badges -->

[license-src]: https://img.shields.io/github/license/ruangus/scout?style=flat&colorA=080f12&colorB=1fa669
[license-href]: https://github.com/ruangus/scout/blob/main/LICENSE
