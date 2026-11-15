export const sha = "289a53f7b1fc40049219c6e69022db2fb859c356"

export const question = "How do I retry an Effect up to 3 times?"

export const sourceFile = "packages/effect/src/Effect.ts"
export const sourceLine = 4273

export const sourceExcerpt = [
  "export const retry: {",
  "  <E, O extends Retry.Options<E>>(options: O): <A, R>(self: Effect<A, E, R>) => Retry.Return<R, E, A, O>",
  "  <B, E, Error, Env>(",
  "    policy: Schedule<B, NoInfer<E>, Error, Env>",
  "  ): <A, R>(self: Effect<A, E, R>) => Effect<A, E | Error, R | Env>"
]
