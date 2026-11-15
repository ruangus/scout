import { Context, Effect, Option, Schema } from "effect";
import type { Repository, Selection, Snapshot } from "./domain.ts"
import type { RateLimited, RefNotFound, RemoteUnavailable, RepositoryNotFound } from "./GitHub.ts"

export type AddResult =
  | { readonly _tag: "AlreadyCached"; readonly snapshot: Snapshot }
  | { readonly _tag: "Downloaded"; readonly snapshot: Snapshot }

export class InvalidRepositoryUrl extends Schema.TaggedError<InvalidRepositoryUrl>()("InvalidRepositoryUrl", {
  input: Schema.String
}) {}

export class ReadFailed extends Schema.TaggedError<ReadFailed>()("ReadFailed", {
  path: Schema.String,
  cause: Schema.Defect()
}) {}

export class WriteFailed extends Schema.TaggedError<WriteFailed>()("WriteFailed", {
  path: Schema.String,
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
