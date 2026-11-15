import { Context, Effect, Option, Schema } from "effect";
import { Repository, Selection, type Snapshot } from "./domain.ts"

export type AddResult =
  | { readonly _tag: "AlreadyCached"; readonly snapshot: Snapshot }
  | { readonly _tag: "Downloaded"; readonly snapshot: Snapshot }

export class InvalidRepositoryUrl extends Schema.TaggedError<InvalidRepositoryUrl>()("InvalidRepositoryUrl", {
  input: Schema.String
}) {}

export class RepositoryNotFound extends Schema.TaggedError<RepositoryNotFound>()("RepositoryNotFound", {
  repository: Repository
}) {}

export class ReadFailed extends Schema.TaggedError<ReadFailed>()("ReadFailed", {
  path: Schema.String,
  cause: Schema.Defect()
}) {}

export class WriteFailed extends Schema.TaggedError<WriteFailed>()("WriteFailed", {
  path: Schema.String,
  cause: Schema.Defect()
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

export class SnapshotCache extends Context.Service<SnapshotCache, {
  add(
    repository: Repository,
    selection: Option.Option<Selection>
  ): Effect.Effect<
    AddResult,
    RepositoryNotFound | RefNotFound | RateLimited | RemoteUnavailable | ReadFailed | WriteFailed
  >
}>()("scout/SnapshotCache") {}
