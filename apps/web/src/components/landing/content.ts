export const github = "https://github.com/ruangus/scout"

export const install = "bun add -g @ruangus/scout"

export const skill = "scout skill install"

export const session = {
  question: "How do I retry an Effect up to 3 times? We're on effect 4.1.4.",
  repository: "effect-ts/effect",
  url: "https://github.com/effect-ts/effect",
  tag: "effect@4.1.4",
  sha: "289a53f",
  path: "~/.scout/github.com/effect-ts/effect/tag/effect%404.1.4/289a53f…",
  file: "packages/effect/src/Effect.ts",
  range: [7679, 7686] as const,
  line: 7682,
  answer: "task.pipe(Effect.retry({ times: 3 }))"
}

export const source = [
  "  export interface Options<E> {",
  "    while?: ((error: E) => boolean | Effect<boolean, any, any>) | undefined",
  "    until?: ((error: E) => boolean | Effect<boolean, any, any>) | undefined",
  "    times?: number | undefined",
  "    schedule?: Schedule<any, E, any, any> | undefined",
  "  }",
  "}",
  ""
]

export const steps = [
  {
    name: "Select",
    text: "The agent hits a question about a library and works out which repository and which branch, tag, or commit you mean. When the version is ambiguous, it asks.",
    command: "scout list effect"
  },
  {
    name: "Obtain",
    text: "If the snapshot is missing, it downloads that exact revision from GitHub. Cached branches refresh on request; tags and commits never move.",
    command: "scout add <url> --tag effect@4.1.4"
  },
  {
    name: "Consult",
    text: "It reads the files under the snapshot's path, like any other folder, and answers with the file and line it read.",
    command: "rg retry ~/.scout/…/289a53f…"
  }
]

export const commands = [
  { run: "scout add <url> [selector]", does: "Cache a snapshot. Pass --branch, --tag, or --commit; without one, uses the default branch." },
  { run: "scout list [query]", does: "Show each cached snapshot with its path and revision." },
  { run: "scout update <owner/repo>", does: "Refresh cached branches older than an hour." },
  { run: "scout remove <owner/repo> [selector]", does: "Remove one version, or the whole repository without a selector." },
  { run: "scout skill install", does: "Teach your agent when and how to use scout." }
]

export const settings = [
  { name: "GITHUB_TOKEN", does: "Reach private repositories and raise GitHub's rate limit." },
  { name: "SCOUT_HOME", does: "Keep snapshots somewhere other than ~/.scout." }
]
