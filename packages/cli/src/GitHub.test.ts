import { expect, test } from "bun:test"
import { DateTime, Effect, Layer, Schema } from "effect"
import { HttpClient, HttpClientResponse, HttpStatus } from "effect/http"
import { Selection, Sha, type Repository } from "./domain.ts"
import { GitHub } from "./GitHub.ts"

const repository: Repository = { owner: "acme", name: "widget" }
const sha = Schema.decodeUnknownSync(Sha)("289a53f7b1fc40049219c6e69022db2fb859c356")

const respondWith = (status: HttpStatus.Literal, body: string, headers: Record<string, string> = {}) => {
  const urls: Array<string> = []

  const layer = Layer.succeed(
    HttpClient.HttpClient,
    HttpClient.make((request) =>
      Effect.sync(() => {
        urls.push(request.url)

        return HttpClientResponse.fromWeb(request, new Response(body, { status: HttpStatus.fromLiteral(status), headers }))
      })
    )
  )

  return { urls, layer }
}

const run = <A, E>(http: Layer.Layer<HttpClient.HttpClient>, use: (github: GitHub["Service"]) => Effect.Effect<A, E>) =>
  Effect.runPromise(
    Effect.gen(function* () {
      return yield* use(yield* GitHub)
    }).pipe(Effect.provide(GitHub.layer.pipe(Layer.provide(http))))
  )

test("reads the default branch", async () => {
  const http = respondWith("OK", JSON.stringify({ default_branch: "trunk" }))

  expect(await run(http.layer, (github) => github.defaultBranch(repository))).toBe("trunk")
  expect(http.urls).toEqual(["https://api.github.com/repos/acme/widget"])
})

test("fails with RepositoryNotFound when the repository is missing", async () => {
  const http = respondWith("NotFound", JSON.stringify({ message: "Not Found" }))
  const error = await run(http.layer, (github) => Effect.flip(github.defaultBranch(repository)))

  expect(error._tag).toBe("RepositoryNotFound")
})

test("resolves a branch to its sha", async () => {
  const http = respondWith("OK", sha)
  const selection = Selection.cases.Branch.make({ name: "feature/x" })

  expect(await run(http.layer, (github) => github.resolve(repository, selection))).toBe(sha)
  expect(http.urls).toEqual(["https://api.github.com/repos/acme/widget/commits/refs%2Fheads%2Ffeature%2Fx"])
})

test("fails with RefNotFound when the ref is missing", async () => {
  const http = respondWith("UnprocessableEntity", JSON.stringify({ message: "No commit found for SHA: refs/tags/v9" }))
  const selection = Selection.cases.Tag.make({ name: "v9" })
  const error = await run(http.layer, (github) => Effect.flip(github.resolve(repository, selection)))

  expect(error._tag).toBe("RefNotFound")
})

test("fails with RateLimited when the quota is exhausted", async () => {
  const http = respondWith("Forbidden", JSON.stringify({ message: "API rate limit exceeded" }), {
    "x-ratelimit-remaining": "0",
    "x-ratelimit-reset": "1800000000"
  })

  const resetAt = await run(http.layer, (github) =>
    github.defaultBranch(repository).pipe(
      Effect.andThen(() => Effect.die("expected RateLimited")),
      Effect.catchTag("RateLimited", (error) => Effect.succeed(error.resetAt))
    ))

  expect(DateTime.toEpochMillis(resetAt)).toBe(1_800_000_000_000)
})

test("fails with RemoteUnavailable when GitHub answers with an unexpected status", async () => {
  const http = respondWith("Unauthorized", JSON.stringify({ message: "Bad credentials" }))
  const error = await run(http.layer, (github) => Effect.flip(github.tarball(repository, sha)))

  expect(error._tag).toBe("RemoteUnavailable")
})
