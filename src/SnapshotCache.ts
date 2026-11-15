import { Array, Context, DateTime, Effect, FileSystem, Layer, Option, Order, Path, Schema } from "effect";
import { Selection, Snapshot, type Repository } from "./domain.ts"
import { GitHub, type RateLimited, type RefNotFound, type RemoteUnavailable, type RepositoryNotFound } from "./GitHub.ts"

export const AddResult = Schema.TaggedUnion({
  AlreadyCached: { snapshot: Snapshot },
  Downloaded: { snapshot: Snapshot }
})

export type AddResult = typeof AddResult.Type

export class ReadFailed extends Schema.TaggedError<ReadFailed>()("ReadFailed", {
  path: Schema.String,
  cause: Schema.Defect()
}) {}

export class WriteFailed extends Schema.TaggedError<WriteFailed>()("WriteFailed", {
  path: Schema.String,
  cause: Schema.Defect()
}) {}

const SnapshotJson = Schema.fromJsonString(Schema.toCodecJson(Snapshot))
const metadataFile = ".scout.json"

export class SnapshotCache extends Context.Service<SnapshotCache, {
  add(
    repository: Repository,
    selection: Option.Option<Selection>
  ): Effect.Effect<
    AddResult,
    RepositoryNotFound | RefNotFound | RateLimited | RemoteUnavailable | ReadFailed | WriteFailed
  >

  list(query: Option.Option<string>): Effect.Effect<ReadonlyArray<Snapshot>, ReadFailed>
}>()("scout/SnapshotCache") {
  static readonly layer = (root: string) =>
    Layer.effect(
      SnapshotCache,
      Effect.gen(function* () {
        const github = yield* GitHub
        const fs = yield* FileSystem.FileSystem
        const path = yield* Path.Path

        const readFailed = (at: string) => (cause: unknown) => new ReadFailed({ path: at, cause })
        const writeFailed = (at: string) => (cause: unknown) => new WriteFailed({ path: at, cause })

        const selectionDirectory = (repository: Repository, selection: Selection) =>
          path.join(
            root,
            "github.com",
            repository.owner,
            repository.name,
            ...Selection.match(selection, {
              Branch: (branch) => ["branch", encodeURIComponent(branch.name)],
              Tag: (tag) => ["tag", encodeURIComponent(tag.name)],
              Commit: (commit) => ["commit", commit.sha]
            })
          )

        const readSnapshot = Effect.fnUntraced(function* (directory: string) {
          const file = path.join(directory, metadataFile)
          const text = yield* fs.readFileString(file).pipe(Effect.mapError(readFailed(file)))

          return yield* Schema.decodeUnknownEffect(SnapshotJson)(text).pipe(Effect.mapError(readFailed(file)))
        })

        const entries = Effect.fnUntraced(function* (directory: string) {
          const exists = yield* fs.exists(directory).pipe(Effect.mapError(readFailed(directory)))

          if (!exists) return []

          const names = yield* fs.readDirectory(directory).pipe(Effect.mapError(readFailed(directory)))

          return Array.sort(names.filter((name) => !name.startsWith(".")), Order.String)
        })

        const findCached = Effect.fnUntraced(function* (directory: string) {
          const revisions = yield* entries(directory)
          const snapshots = yield* Effect.forEach(revisions, (revision) => readSnapshot(path.join(directory, revision)))

          if (!Array.isReadonlyArrayNonEmpty(snapshots)) return Option.none<Snapshot>()

          return Option.some(Array.max(snapshots, Order.mapInput(DateTime.Order, (snapshot: Snapshot) => snapshot.fetchedAt)))
        })

        const download = Effect.fnUntraced(function* (repository: Repository, selection: Selection) {
          const sha = yield* github.resolve(repository, selection)
          const bytes = yield* github.tarball(repository, sha)
          const target = path.join(selectionDirectory(repository, selection), sha)
          const staging = path.join(root, ".staging")

          yield* fs.makeDirectory(staging, { recursive: true }).pipe(Effect.mapError(writeFailed(staging)))

          const temporary = yield* fs.makeTempDirectoryScoped({ directory: staging }).pipe(
            Effect.mapError(writeFailed(staging))
          )

          yield* Effect.tryPromise({
            try: () => new Bun.Archive(bytes).extract(temporary),
            catch: writeFailed(temporary)
          })
          const [extracted] = yield* fs.readDirectory(temporary).pipe(Effect.mapError(readFailed(temporary)))

          if (extracted === undefined) {
            return yield* new WriteFailed({ path: temporary, cause: "tarball is empty" })
          }

          const content = path.join(temporary, extracted)

          const snapshot: Snapshot = {
            repository,
            path: target,
            selection,
            fetchedAt: yield* DateTime.now,
            sha
          }

          const metadata = path.join(content, metadataFile)
          const json = yield* Schema.encodeEffect(SnapshotJson)(snapshot).pipe(Effect.mapError(writeFailed(metadata)))
          yield* fs.writeFileString(metadata, json).pipe(Effect.mapError(writeFailed(metadata)))

          yield* fs.makeDirectory(path.dirname(target), { recursive: true }).pipe(Effect.mapError(writeFailed(target)))
          yield* fs.rename(content, target).pipe(Effect.mapError(writeFailed(target)))

          return snapshot
        }, Effect.scoped)

        const add = Effect.fn("SnapshotCache.add")(function* (
          repository: Repository,
          selection: Option.Option<Selection>
        ) {
          const selected: Selection = Option.isSome(selection)
            ? selection.value
            : Selection.cases.Branch.make({ name: yield* github.defaultBranch(repository) })

          const cached = yield* findCached(selectionDirectory(repository, selected))

          if (Option.isSome(cached)) {
            return AddResult.cases.AlreadyCached.make({ snapshot: cached.value })
          }

          const snapshot = yield* download(repository, selected)

          return AddResult.cases.Downloaded.make({ snapshot })
        })

        const list = Effect.fn("SnapshotCache.list")(function* (query: Option.Option<string>) {
          const host = path.join(root, "github.com")

          const matches = (owner: string, name: string) =>
            Option.match(query, {
              onNone: () => true,
              onSome: (text) => `${owner}/${name}`.toLowerCase().includes(text.toLowerCase())
            })

          const snapshots: Array<Snapshot> = []

          for (const owner of yield* entries(host)) {
            for (const name of yield* entries(path.join(host, owner))) {
              if (!matches(owner, name)) continue

              for (const kind of yield* entries(path.join(host, owner, name))) {
                for (const ref of yield* entries(path.join(host, owner, name, kind))) {
                  const cached = yield* findCached(path.join(host, owner, name, kind, ref))

                  if (Option.isSome(cached)) snapshots.push(cached.value)
                }
              }
            }
          }

          return snapshots
        })

        return SnapshotCache.of({ add, list })
      })
    )
}
