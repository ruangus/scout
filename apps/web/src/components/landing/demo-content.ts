export const github = "https://github.com/ruangus/scout"

export const install = "bun add -g @ruangus/scout"

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
