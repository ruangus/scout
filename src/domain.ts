import { Schema, SchemaTransformation } from "effect";

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
