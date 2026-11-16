#!/usr/bin/env bun
import { BunRuntime, BunServices } from "@effect/platform-bun"
import { Array, Config, Console, Effect, Layer, Option, Schema } from "effect"
import { Argument, CliError, Command, Flag } from "effect/cli"
import { FetchHttpClient } from "effect/http"
import { homedir } from "node:os"
import { join } from "node:path"
import packageJson from "../package.json" with { type: "json" }
import { RepositoryName, RepositoryUrl, Selection, Sha, Snapshot } from "./domain.ts"
import { GitHub, RateLimited, RefNotFound, RemoteUnavailable, RepositoryNotFound } from "./GitHub.ts"
import { ReadFailed, WriteFailed } from "./FileErrors.ts"
import { Skill, SkillConflict, SkillInstallResult } from "./Skill.ts"
import { AddResult, SnapshotCache, UpdateResult } from "./SnapshotCache.ts"

const ScoutError = Schema.Union([
  RepositoryNotFound,
  RefNotFound,
  RateLimited,
  RemoteUnavailable,
  ReadFailed,
  WriteFailed,
  SkillConflict
])

const printJson = <S extends Schema.Top>(schema: S, print: (line: string) => Effect.Effect<void>) => {
  const encode = Schema.toCodecJson(schema).pipe(Schema.fromJsonString, Schema.encodeEffect)

  return (value: S["Type"]) => encode(value).pipe(Effect.flatMap(print), Effect.orDie)
}

const printError = printJson(ScoutError, Console.error)

const selectors = {
  branch: Flag.String("branch").pipe(
    Flag.withDescription("Branch name"),
    Flag.withSchema(Schema.NonEmptyString),
    Flag.optional
  ),
  tag: Flag.String("tag").pipe(
    Flag.withDescription("Tag name"),
    Flag.withSchema(Schema.NonEmptyString),
    Flag.optional
  ),
  commit: Flag.String("commit").pipe(
    Flag.withDescription("Full 40-character commit sha"),
    Flag.withSchema(Sha),
    Flag.optional
  )
}

const selectionFrom = Effect.fnUntraced(function* (flags: {
  readonly branch: Option.Option<string>
  readonly tag: Option.Option<string>
  readonly commit: Option.Option<Sha>
}) {
  const selections = Array.getSomes([
    flags.branch.pipe(Option.map((name) => Selection.cases.Branch.make({ name }))),
    flags.tag.pipe(Option.map((name) => Selection.cases.Tag.make({ name }))),
    flags.commit.pipe(Option.map((sha) => Selection.cases.Commit.make({ sha })))
  ])

  if (selections.length > 1) {
    return yield* new CliError.UserError({
      cause: selections,
      userMessage: "Pass at most one of --branch, --tag or --commit"
    })
  }

  return Array.head(selections)
})

const repositoryName = Argument.String("owner/repo").pipe(
  Argument.withDescription("Repository, like effect-ts/effect"),
  Argument.withSchema(RepositoryName)
)

const add = Command.make(
  "add",
  {
    repository: Argument.String("github-url").pipe(
      Argument.withDescription("Repository URL, like https://github.com/effect-ts/effect"),
      Argument.withSchema(RepositoryUrl)
    ),
    ...selectors
  },
  Effect.fn("cli.add")(function* ({ repository, ...flags }) {
    const selection = yield* selectionFrom(flags)
    const cache = yield* SnapshotCache

    yield* cache.add(repository, selection).pipe(
      Effect.tapError(printError),
      Effect.flatMap(printJson(AddResult, Console.log))
    )
  })
).pipe(
  Command.withDescription("Cache a snapshot of a GitHub repository; without a selector, uses the default branch")
)

const list = Command.make(
  "list",
  {
    query: Argument.String("query").pipe(
      Argument.withDescription("Text to match against owner/repo, case-insensitive"),
      Argument.optional
    )
  },
  Effect.fn("cli.list")(function* ({ query }) {
    const cache = yield* SnapshotCache

    yield* cache.list(query).pipe(
      Effect.tapError(printError),
      Effect.flatMap(printJson(Schema.Array(Snapshot), Console.log))
    )
  })
).pipe(
  Command.withDescription("List the newest cached snapshot of each selection, with its path and revision")
)

const update = Command.make(
  "update",
  { repository: repositoryName },
  Effect.fn("cli.update")(function* ({ repository }) {
    const cache = yield* SnapshotCache

    yield* cache.update(repository).pipe(
      Effect.tapError(printError),
      Effect.flatMap(printJson(Schema.Array(UpdateResult), Console.log))
    )
  })
).pipe(
  Command.withDescription("Refresh the cached branches of a repository that are older than one hour; tags and commits never change")
)

const remove = Command.make(
  "remove",
  { repository: repositoryName, ...selectors },
  Effect.fn("cli.remove")(function* ({ repository, ...flags }) {
    const selection = yield* selectionFrom(flags)
    const cache = yield* SnapshotCache

    yield* cache.remove(repository, selection).pipe(
      Effect.tapError(printError),
      Effect.flatMap(printJson(Schema.Array(Snapshot), Console.log))
    )
  })
).pipe(
  Command.withDescription("Remove one cached selection, or every selection of the repository when no selector is given")
)

const installSkill = Command.make(
  "install",
  {},
  Effect.fn("cli.skill.install")(function* () {
    yield* (yield* Skill).install.pipe(
      Effect.tapError(printError),
      Effect.flatMap(printJson(SkillInstallResult, Console.log))
    )
  })
).pipe(
  Command.withDescription("Install the scout skill in ~/.agents/skills and link it from ~/.claude/skills")
)

const skill = Command.make("skill").pipe(
  Command.withDescription("Manage the agent skill that teaches agents to use scout"),
  Command.withSubcommands([installSkill])
)

const scout = Command.make("scout").pipe(
  Command.withDescription("Manage source snapshots of GitHub repositories for agents"),
  Command.withSubcommands([add, list, update, remove, skill])
)

const SnapshotCacheLive = Effect.gen(function* () {
  const root = yield* Config.String("SCOUT_HOME").pipe(Config.withDefault(join(homedir(), ".scout")))

  return SnapshotCache.layer(root)
}).pipe(
  Layer.unwrap,
  Layer.provide(GitHub.layer),
  Layer.provide(FetchHttpClient.layer)
)

scout.pipe(
  Command.run({ version: packageJson.version }),
  Effect.provide(Layer.mergeAll(SnapshotCacheLive, Skill.layer(homedir()))),
  Effect.provide(BunServices.layer),
  BunRuntime.runMain({ disableErrorReporting: true })
)
