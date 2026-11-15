import { Schema } from "effect";

export const Sha = Schema.String.pipe(
  Schema.check(Schema.isPattern(/^[0-9a-f]{40}$/)),
  Schema.brand('Sha')
)

export type Sha = typeof Sha.Type

export const Selection = Schema.TaggedUnion({
  Branch: { name: Schema.String },
  Tag: { name: Schema.String },
  Commit: { sha: Sha }
})

export type Selection = typeof Selection.Type

export const Repository = Schema.Struct({
  owner: Schema.String,
  name: Schema.String
})

export type Repository = typeof Repository.Type

export const Snapshot = Schema.Struct({
  repository: Repository,
  path: Schema.String,
  selection: Selection,
  fetchedAt: Schema.DateTimeUtc,
  sha: Sha,
})

export type Snapshot = typeof Snapshot.Type
