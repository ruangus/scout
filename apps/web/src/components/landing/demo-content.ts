export const github = "https://github.com/ruangus/scout"

export const install = "bun add -g @ruangus/scout"

export const installPrompt = `Install scout on this machine: a CLI that downloads a library's source at an exact Git branch, tag, or commit, plus a skill that tells you when to read that source instead of answering from memory.

1. Run \`bun --version\`. scout runs on Bun 1.4 or newer. If Bun is missing or older, stop and ask me to install or upgrade it from https://bun.sh.
2. Run \`${install}\`. Done when \`scout --version\` prints a version.
3. Run \`scout skill install\`. It writes the skill to \`~/.agents/skills/scout\` and links it from \`~/.claude/skills/scout\`. Done when \`~/.agents/skills/scout/SKILL.md\` exists.
4. Run \`scout list\`. Done when it prints JSON and exits 0; an empty list is expected on a fresh install.

Then reply with the scout version and the skill path, and tell me to start a new agent session: skills load at session start, so this session cannot use scout yet.

If I work with private repositories or hit GitHub's rate limit, a \`GITHUB_TOKEN\` in the environment covers both.`

export const question = "How do I retry an Effect up to 3 times?"

export const answer = "task.pipe(Effect.retry({ times: 3 }))"

export const address = {
  repository: "effect-ts/effect",
  tag: "effect@4.1.4",
  commit: "289a53f",
  file: "packages/effect/src/Effect.ts",
  line: 7682
}

export const sourceStart = 7674

export const source = [
  "   * Options that control whether and how a failing effect is retried.",
  "   *",
  "   * @category error handling",
  "   * @since 2.0.0",
  "   */",
  "  export interface Options<E> {",
  "    while?: ((error: E) => boolean | Effect<boolean, any, any>) | undefined",
  "    until?: ((error: E) => boolean | Effect<boolean, any, any>) | undefined",
  "    times?: number | undefined",
  "    schedule?: Schedule<any, E, any, any> | undefined",
  "  }",
  "}",
  "",
  "/**",
  " * Retries typed failures from an effect according to a retry policy.",
  " *",
  " * **When to use**"
]
