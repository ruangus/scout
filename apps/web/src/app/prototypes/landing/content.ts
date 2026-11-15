export const install = "bun add -g @ruangus/scout"

export const repository = "effect-ts/effect"
export const tag = "effect@4.1.4"
export const sha = "289a53f7b1fc40049219c6e69022db2fb859c356"
export const snapshotPath = `~/.scout/github.com/effect-ts/effect/tag/effect%404.1.4/${sha.slice(0, 12)}…`

export const question = "How do I retry an Effect up to 3 times?"

export const addCommand = `scout add https://github.com/${repository} --tag ${tag}`

export const sourceFile = "packages/effect/src/Effect.ts"
export const sourceLine = 4273

export const sourceExcerpt = [
  "export const retry: {",
  "  <E, O extends Retry.Options<E>>(options: O): <A, R>(",
  "    self: Effect<A, E, R>",
  "  ) => Retry.Return<R, E, A, O>",
  "  <B, E, Error, Env>(policy: Schedule<B, NoInfer<E>, Error, Env>): …"
]

export const memoryAnswer = {
  code: `import { Effect, Schedule } from "@effect/io"\n\nEffect.retryN(task, 3)`,
  note: "Effect.retryN was removed, and @effect/io is a package from 2023."
}

export const scoutAnswer = {
  code: `import { Effect } from "effect"\n\ntask.pipe(Effect.retry({ times: 3 }))`,
  note: `Effect.retry takes { times } directly in ${tag}.`
}
