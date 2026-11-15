---
name: scout
description: Use when reading a library's implementation, explaining behavior its types do not reveal, or consulting source at a specific Git branch, tag, or commit.
---

# Scout

Scout keeps read-only snapshots of GitHub repositories under `~/.scout` (or `$SCOUT_HOME`). Each command prints JSON on stdout; a failure prints a tagged error on stderr and exits 1.

## Select

1. Identify the repository and any requested Git reference. Ask when the repository or the reference kind is ambiguous: a branch and a tag with the same name are different selections. When the request names only a package version, ask for the Git reference instead of deriving a tag.
2. Run `scout list <query>` and match the repository, `selection._tag`, and the complete `selection.name` or `selection.sha`.

## Obtain

- **Not cached:** run `scout add <github-url>` with at most one of `--branch <name>`, `--tag <name>`, or `--commit <full-sha>`. With no selector it selects the default branch at that moment, and `selection` in the result names it.
- **Cached branch:** run `scout update <owner/repo>`. `Fresh` was checked within the last hour and left as is, `Unchanged` was checked and is current, `Updated` published a new revision at a new `path`.
- **Cached tag or commit:** use the fixed snapshot. To follow a tag that moved, run `scout remove <owner/repo> --tag <name>` and add it again.

When a command fails, report the error's `_tag`. `RateLimited` carries `resetAt`; `RepositoryNotFound` also covers a private repository while `GITHUB_TOKEN` is unset. Read an existing snapshot only when it satisfies the request, and give its `sha` rather than calling it refreshed.

## Consult

Take `path` and `sha` from the latest `add`, `update`, or `list` output: an update can move a branch to a new path. Search and read the files under `path` directly; they need no install or build.
