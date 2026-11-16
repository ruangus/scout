import { Array, Effect, Option, Schema, SchemaTransformation } from "effect";

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

export class ConflictingSelectors extends Schema.TaggedError<ConflictingSelectors>()("ConflictingSelectors", {
  selectors: Schema.Array(Schema.Literals(["branch", "tag", "commit"]))
}) {}

export class InvalidSha extends Schema.TaggedError<InvalidSha>()("InvalidSha", {
  sha: Schema.String
}) {}

export const selectionFrom = Effect.fnUntraced(function* (selectors: {
  readonly branch: Option.Option<string>
  readonly tag: Option.Option<string>
  readonly commit: Option.Option<string>
}) {
  const given = Array.filter(["branch", "tag", "commit"] as const, (selector) => Option.isSome(selectors[selector]))

  if (given.length > 1) {
    return yield* new ConflictingSelectors({ selectors: given })
  }

  if (Option.isSome(selectors.commit)) {
    const input = selectors.commit.value

    const sha = yield* Schema.decodeUnknownEffect(Sha)(input).pipe(
      Effect.mapError(() => new InvalidSha({ sha: input }))
    )

    return Option.some(Selection.cases.Commit.make({ sha }))
  }

  return Array.head(Array.getSomes([
    selectors.branch.pipe(Option.map((name) => Selection.cases.Branch.make({ name }))),
    selectors.tag.pipe(Option.map((name) => Selection.cases.Tag.make({ name })))
  ]))
})

export const Repository = Schema.Struct({
  owner: Schema.String,
  name: Schema.String
})

export type Repository = typeof Repository.Type

export const RepositoryName = Schema.String.pipe(
  Schema.check(Schema.isPattern(/^[\w.-]+\/[\w.-]+$/, {
    message: "Expected a repository like <owner>/<repo>"
  })),
  Schema.decodeTo(Repository, SchemaTransformation.transform({
    decode: (name) => {
      const [owner = "", repository = ""] = name.split("/")

      return { owner, name: repository }
    },
    encode: (repository) => `${repository.owner}/${repository.name}`
  }))
)

const githubPrefix = /^(?:https:\/\/)?github\.com\//
const githubSuffix = /(?:\.git)?\/?$/

export const RepositoryUrl = Schema.String.pipe(
  Schema.check(Schema.isPattern(/^(?:https:\/\/)?github\.com\/[\w.-]+\/[\w.-]+?(?:\.git)?\/?$/, {
    message: "Expected a GitHub repository URL like https://github.com/<owner>/<repo>"
  })),
  Schema.decodeTo(Repository, SchemaTransformation.transform({
    decode: (url) => {
      const [owner = "", name = ""] = url.replace(githubPrefix, "").replace(githubSuffix, "").split("/")

      return { owner, name }
    },
    encode: (repository) => `https://github.com/${repository.owner}/${repository.name}`
  }))
)

export const Snapshot = Schema.Struct({
  repository: Repository,
  path: Schema.String,
  selection: Selection,
  fetchedAt: Schema.DateTimeUtc,
  sha: Sha,
})

export type Snapshot = typeof Snapshot.Type
