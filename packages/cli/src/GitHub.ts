import { Config, Context, DateTime, Effect, flow, Layer, Option, Schedule, Schema } from "effect";
import { Headers, HttpClient, HttpClientRequest, HttpClientResponse, HttpStatus } from "effect/http"
import { Repository, Selection, Sha } from "./domain.ts"

export class RepositoryNotFound extends Schema.TaggedError<RepositoryNotFound>()("RepositoryNotFound", {
  repository: Repository
}) {}

export class RefNotFound extends Schema.TaggedError<RefNotFound>()("RefNotFound", {
  repository: Repository,
  selection: Selection
}) {}

export class RateLimited extends Schema.TaggedError<RateLimited>()("RateLimited", {
  resetAt: Schema.DateTimeUtc
}) {}

export class RemoteUnavailable extends Schema.TaggedError<RemoteUnavailable>()("RemoteUnavailable", {
  cause: Schema.Defect()
}) {}

export class GitHub extends Context.Service<GitHub, {
  defaultBranch(
    repository: Repository
  ): Effect.Effect<string, RepositoryNotFound | RateLimited | RemoteUnavailable>

  resolve(
    repository: Repository,
    selection: Selection
  ): Effect.Effect<Sha, RepositoryNotFound | RefNotFound | RateLimited | RemoteUnavailable>

  tarball(
    repository: Repository,
    sha: Sha
  ): Effect.Effect<Uint8Array, RateLimited | RemoteUnavailable>
}>()("scout/GitHub") {
  static readonly layer = Layer.effect(
    GitHub,
    Effect.gen(function* () {
      const token = yield* Config.option(Config.Redacted("GITHUB_TOKEN"))

      const client = (yield* HttpClient.HttpClient).pipe(
        HttpClient.mapRequest(flow(
          HttpClientRequest.prependUrl("https://api.github.com"),
          HttpClientRequest.setHeader("User-Agent", "scout-cli"),
          (request) => Option.match(token, {
            onNone: () => request,
            onSome: (secret) => HttpClientRequest.bearerToken(request, secret)
          })
        )),
        HttpClient.retryTransient({ schedule: Schedule.exponential(200), times: 2 })
      )

      const failIfRateLimited = (response: HttpClientResponse.HttpClientResponse) =>
        Headers.get(response.headers, "x-ratelimit-remaining").pipe(
          Option.filter((remaining) => remaining === "0"),
          Option.flatMap(() => Headers.get(response.headers, "x-ratelimit-reset")),
          Option.flatMap((seconds) => DateTime.make(Number(seconds) * 1000)),
          Option.match({
            onNone: () => Effect.succeed(response),
            onSome: (resetAt) => Effect.fail(new RateLimited({ resetAt }))
          })
        )

      const get = Effect.fnUntraced(function* (url: string, accept: string) {
        const response = yield* client.get(url, { headers: { accept } }).pipe(
          Effect.mapError((cause) => new RemoteUnavailable({ cause }))
        )

        return yield* HttpClientResponse.matchStatus(response, {
          [HttpStatus.fromLiteral("Forbidden")]: failIfRateLimited,
          [HttpStatus.fromLiteral("TooManyRequests")]: failIfRateLimited,
          orElse: (other) => Effect.succeed(other)
        })
      })

      const unexpected = (response: HttpClientResponse.HttpClientResponse) =>
        new RemoteUnavailable({ cause: `GitHub answered ${response.status} for ${response.request.url}` })

      const repositoryPath = (repository: Repository) =>
        `/repos/${encodeURIComponent(repository.owner)}/${encodeURIComponent(repository.name)}`

      const defaultBranch = Effect.fn("GitHub.defaultBranch")(function* (repository: Repository) {
        const response = yield* get(repositoryPath(repository), "application/vnd.github+json")

        return yield* HttpClientResponse.matchStatus(response, {
          [HttpStatus.fromLiteral("OK")]: (ok) => HttpClientResponse.schemaBodyJson(RepositoryBody)(ok).pipe(
            Effect.map((body) => body.default_branch),
            Effect.mapError((cause) => new RemoteUnavailable({ cause }))
          ),
          [HttpStatus.fromLiteral("NotFound")]: () => new RepositoryNotFound({ repository }),
          orElse: unexpected
        })
      })

      const resolve = Effect.fn("GitHub.resolve")(function* (repository: Repository, selection: Selection) {
        const ref = Selection.match(selection, {
          Branch: (branch) => `refs/heads/${branch.name}`,
          Tag: (tag) => `refs/tags/${tag.name}`,
          Commit: (commit) => commit.sha
        })

        const response = yield* get(
          `${repositoryPath(repository)}/commits/${encodeURIComponent(ref)}`,
          "application/vnd.github.sha"
        )

        return yield* HttpClientResponse.matchStatus(response, {
          [HttpStatus.fromLiteral("OK")]: (ok) => ok.text.pipe(
            Effect.flatMap((text) => Schema.decodeUnknownEffect(Sha)(text.trim())),
            Effect.mapError((cause) => new RemoteUnavailable({ cause }))
          ),
          [HttpStatus.fromLiteral("NotFound")]: () => new RepositoryNotFound({ repository }),
          [HttpStatus.fromLiteral("UnprocessableEntity")]: () => new RefNotFound({ repository, selection }),
          orElse: unexpected
        })
      })

      const tarball = Effect.fn("GitHub.tarball")(function* (repository: Repository, sha: Sha) {
        const response = yield* get(`${repositoryPath(repository)}/tarball/${sha}`, "application/vnd.github+json")

        return yield* HttpClientResponse.matchStatus(response, {
          [HttpStatus.fromLiteral("OK")]: (ok) => ok.arrayBuffer.pipe(
            Effect.map((buffer) => new Uint8Array(buffer)),
            Effect.mapError((cause) => new RemoteUnavailable({ cause }))
          ),
          orElse: unexpected
        })
      })

      return GitHub.of({ defaultBranch, resolve, tarball })
    })
  )
}

const RepositoryBody = Schema.Struct({ default_branch: Schema.String })
