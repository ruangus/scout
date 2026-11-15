import { Context, Effect, Schema } from "effect";
import { Repository, Selection, type Sha } from "./domain.ts"

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
}>()("scout/GitHub") {}
