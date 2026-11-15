#!/usr/bin/env bun
import { BunRuntime, BunServices } from "@effect/platform-bun"
import { Array, Config, Console, Effect, Layer, Option, Schema } from "effect"
import { Argument, CliError, Command, Flag } from "effect/cli"
import { FetchHttpClient } from "effect/http"
import { homedir } from "node:os"
import { join } from "node:path"
import { RepositoryUrl, Selection, Sha } from "./domain.ts"
import { GitHub, RateLimited, RefNotFound, RemoteUnavailable, RepositoryNotFound } from "./GitHub.ts"
import { AddResult, ReadFailed, SnapshotCache, WriteFailed } from "./SnapshotCache.ts"

const AddError = Schema.Union([RepositoryNotFound, RefNotFound, RateLimited, RemoteUnavailable, ReadFailed, WriteFailed])

const printJson = <S extends Schema.Top>(schema: S, print: (line: string) => Effect.Effect<void>) => {
  const encode = Schema.encodeEffect(Schema.fromJsonString(Schema.toCodecJson(schema)))

  return (value: S["Type"]) => encode(value).pipe(Effect.flatMap(print), Effect.orDie)
}

const add = Command.make(
  "add",
  {
    repository: Argument.String("github-url").pipe(
      Argument.withDescription("Repository URL, like https://github.com/effect-ts/effect"),
      Argument.withSchema(RepositoryUrl)
    ),
    branch: Flag.String("branch").pipe(
      Flag.withDescription("Branch to snapshot"),
      Flag.withSchema(Schema.NonEmptyString),
      Flag.optional
    ),
    tag: Flag.String("tag").pipe(
      Flag.withDescription("Tag to snapshot"),
      Flag.withSchema(Schema.NonEmptyString),
      Flag.optional
    ),
    commit: Flag.String("commit").pipe(
      Flag.withDescription("Full 40-character commit sha to snapshot"),
      Flag.withSchema(Sha),
      Flag.optional
    )
  },
  Effect.fn("cli.add")(function* ({ repository, branch, tag, commit }) {
    const selections = Array.getSomes([
      Option.map(branch, (name) => Selection.cases.Branch.make({ name })),
      Option.map(tag, (name) => Selection.cases.Tag.make({ name })),
      Option.map(commit, (sha) => Selection.cases.Commit.make({ sha }))
    ])

    if (selections.length > 1) {
      return yield* new CliError.UserError({
        cause: selections,
        userMessage: "Pass at most one of --branch, --tag or --commit"
      })
    }

    const cache = yield* SnapshotCache

    const result = yield* cache.add(repository, Array.head(selections)).pipe(
      Effect.tapError(printJson(AddError, Console.error))
    )

    yield* printJson(AddResult, Console.log)(result)
  })
).pipe(
  Command.withDescription("Cache a shallow snapshot of a GitHub repository; without a selector, uses the default branch")
)

const scout = Command.make("scout").pipe(
  Command.withDescription("Manage source snapshots of GitHub repositories for agents"),
  Command.withSubcommands([add])
)

const SnapshotCacheLive = Layer.unwrap(
  Effect.gen(function* () {
    const root = yield* Config.String("SCOUT_HOME").pipe(Config.withDefault(join(homedir(), ".scout")))

    return SnapshotCache.layer(root)
  })
).pipe(
  Layer.provide(GitHub.layer),
  Layer.provide(FetchHttpClient.layer)
)

scout.pipe(
  Command.run({ version: "0.1.0" }),
  Effect.provide(SnapshotCacheLive),
  Effect.provide(BunServices.layer),
  BunRuntime.runMain({ disableErrorReporting: true })
)
