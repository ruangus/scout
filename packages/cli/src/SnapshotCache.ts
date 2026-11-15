import { Array, Context, DateTime, Duration, Effect, FileSystem, Layer, Option, Order, Path, Schema } from "effect";
import { Selection, Snapshot, type Repository, type Sha } from "./domain.ts"
import { readFailed, WriteFailed, writeFailed, type ReadFailed } from "./FileErrors.ts"
import { GitHub, type RateLimited, type RefNotFound, type RemoteUnavailable, type RepositoryNotFound } from "./GitHub.ts"

export const AddResult = Schema.TaggedUnion({
  AlreadyCached: { snapshot: Snapshot },
  Downloaded: { snapshot: Snapshot }
})

export type AddResult = typeof AddResult.Type

export const UpdateResult = Schema.TaggedUnion({
  Fresh: { snapshot: Snapshot },
  Unchanged: { snapshot: Snapshot },
  Updated: { snapshot: Snapshot }
})

export type UpdateResult = typeof UpdateResult.Type

export const branchTtl = Duration.hours(1)

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

  update(
    repository: Repository
  ): Effect.Effect<
    ReadonlyArray<UpdateResult>,
    RepositoryNotFound | RefNotFound | RateLimited | RemoteUnavailable | ReadFailed | WriteFailed
  >

  remove(
    repository: Repository,
    selection: Option.Option<Selection>
  ): Effect.Effect<ReadonlyArray<Snapshot>, ReadFailed | WriteFailed>
}>()("scout/SnapshotCache") {
  static readonly layer = (root: string) =>
    Layer.effect(
      SnapshotCache,
      Effect.gen(function* () {
        const github = yield* GitHub
        const fs = yield* FileSystem.FileSystem
        const path = yield* Path.Path

        const host = path.join(root, "github.com")

        const repositoryDirectory = (repository: Repository) => path.join(host, repository.owner, repository.name)

        const selectionDirectory = (repository: Repository, selection: Selection) =>
          path.join(
            repositoryDirectory(repository),
            ...Selection.match(selection, {
              Branch: (branch) => ["branch", encodeURIComponent(branch.name)],
              Tag: (tag) => ["tag", encodeURIComponent(tag.name)],
              Commit: (commit) => ["commit", commit.sha]
            })
          )

        const entries = Effect.fnUntraced(function* (directory: string) {
          const exists = yield* fs.exists(directory).pipe(Effect.mapError(readFailed(directory)))

          if (!exists) return []

          const names = yield* fs.readDirectory(directory).pipe(Effect.mapError(readFailed(directory)))

          return Array.sort(names.filter((name) => !name.startsWith(".")), Order.String)
        })

        const readSnapshot = Effect.fnUntraced(function* (directory: string) {
          const file = path.join(directory, metadataFile)
          const text = yield* fs.readFileString(file).pipe(Effect.mapError(readFailed(file)))
          const snapshot = yield* Schema.decodeUnknownEffect(SnapshotJson)(text).pipe(Effect.mapError(readFailed(file)))

          return { ...snapshot, path: directory }
        })

        const writeSnapshot = Effect.fnUntraced(function* (snapshot: Snapshot) {
          const file = path.join(snapshot.path, metadataFile)
          const temporary = `${file}.tmp`
          const json = yield* Schema.encodeEffect(SnapshotJson)(snapshot).pipe(Effect.mapError(writeFailed(file)))

          yield* fs.writeFileString(temporary, json).pipe(Effect.mapError(writeFailed(temporary)))
          yield* fs.rename(temporary, file).pipe(Effect.mapError(writeFailed(file)))
        })

        const newest = Effect.fnUntraced(function* (directory: string) {
          const revisions = yield* entries(directory)
          const snapshots = yield* Effect.forEach(revisions, (revision) => readSnapshot(path.join(directory, revision)))

          if (!Array.isReadonlyArrayNonEmpty(snapshots)) return Option.none<Snapshot>()

          return Option.some(Array.max(snapshots, Order.mapInput(DateTime.Order, (snapshot: Snapshot) => snapshot.fetchedAt)))
        })

        const repositorySnapshots = Effect.fnUntraced(function* (repository: Repository) {
          const directory = repositoryDirectory(repository)
          const snapshots: Array<Snapshot> = []

          for (const kind of yield* entries(directory)) {
            for (const ref of yield* entries(path.join(directory, kind))) {
              const snapshot = yield* newest(path.join(directory, kind, ref))

              if (Option.isSome(snapshot)) snapshots.push(snapshot.value)
            }
          }

          return snapshots
        })

        const publish = Effect.fnUntraced(function* (repository: Repository, selection: Selection, sha: Sha) {
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
          const snapshot: Snapshot = { repository, path: content, selection, fetchedAt: yield* DateTime.now, sha }

          yield* writeSnapshot(snapshot)
          yield* fs.makeDirectory(path.dirname(target), { recursive: true }).pipe(Effect.mapError(writeFailed(target)))
          yield* fs.rename(content, target).pipe(Effect.mapError(writeFailed(target)))

          return { ...snapshot, path: target }
        }, Effect.scoped)

        const refresh = Effect.fnUntraced(function* (snapshot: Snapshot, now: DateTime.Utc) {
          if (DateTime.isLessThan(now, DateTime.addDuration(snapshot.fetchedAt, branchTtl))) {
            return UpdateResult.cases.Fresh.make({ snapshot })
          }

          const sha = yield* github.resolve(snapshot.repository, snapshot.selection)

          if (sha === snapshot.sha) {
            const refreshed = { ...snapshot, fetchedAt: now }

            yield* writeSnapshot(refreshed)

            return UpdateResult.cases.Unchanged.make({ snapshot: refreshed })
          }

          const published = yield* publish(snapshot.repository, snapshot.selection, sha)

          return UpdateResult.cases.Updated.make({ snapshot: published })
        })

        const add = Effect.fn("SnapshotCache.add")(function* (
          repository: Repository,
          selection: Option.Option<Selection>
        ) {
          const selected: Selection = Option.isSome(selection)
            ? selection.value
            : Selection.cases.Branch.make({ name: yield* github.defaultBranch(repository) })

          const cached = yield* newest(selectionDirectory(repository, selected))

          if (Option.isSome(cached)) {
            return AddResult.cases.AlreadyCached.make({ snapshot: cached.value })
          }

          const sha = yield* github.resolve(repository, selected)
          const snapshot = yield* publish(repository, selected, sha)

          return AddResult.cases.Downloaded.make({ snapshot })
        })

        const list = Effect.fn("SnapshotCache.list")(function* (query: Option.Option<string>) {
          const matches = (repository: Repository) =>
            Option.match(query, {
              onNone: () => true,
              onSome: (text) => `${repository.owner}/${repository.name}`.toLowerCase().includes(text.toLowerCase())
            })

          const snapshots: Array<Snapshot> = []

          for (const owner of yield* entries(host)) {
            for (const name of yield* entries(path.join(host, owner))) {
              const repository = { owner, name }

              if (matches(repository)) snapshots.push(...(yield* repositorySnapshots(repository)))
            }
          }

          return snapshots
        })

        const update = Effect.fn("SnapshotCache.update")(function* (repository: Repository) {
          const now = yield* DateTime.now

          const branches = (yield* repositorySnapshots(repository)).filter((snapshot) =>
            Selection.guards.Branch(snapshot.selection)
          )

          return yield* Effect.forEach(branches, (snapshot) => refresh(snapshot, now))
        })

        const remove = Effect.fn("SnapshotCache.remove")(function* (
          repository: Repository,
          selection: Option.Option<Selection>
        ) {
          const directory = Option.match(selection, {
            onNone: () => repositoryDirectory(repository),
            onSome: (selected) => selectionDirectory(repository, selected)
          })

          const removed = Option.isSome(selection)
            ? Option.toArray(yield* newest(directory))
            : yield* repositorySnapshots(repository)

          yield* fs.remove(directory, { recursive: true, force: true }).pipe(Effect.mapError(writeFailed(directory)))

          return removed
        })

        return SnapshotCache.of({ add, list, update, remove })
      })
    )
}
