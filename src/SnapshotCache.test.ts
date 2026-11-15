import { BunFileSystem, BunPath } from "@effect/platform-bun"
import { afterEach, expect, test } from "bun:test"
import { Effect, Layer, Option, Schema } from "effect"
import { TestClock } from "effect/testing"
import { mkdtempSync, rmSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { Selection, Sha, type Repository } from "./domain.ts"
import { GitHub, RepositoryNotFound } from "./GitHub.ts"
import { branchTtl, SnapshotCache } from "./SnapshotCache.ts"

const repository: Repository = { owner: "acme", name: "widget" }
const sha = Schema.decodeUnknownSync(Sha)("289a53f7b1fc40049219c6e69022db2fb859c356")
const main = Selection.cases.Branch.make({ name: "main" })
const v1 = Selection.cases.Tag.make({ name: "v1" })
const newerSha = Schema.decodeUnknownSync(Sha)("1b807a063982a2463017d055ef6fc36240222217")

const tarball = await new Bun.Archive(
  { "acme-widget-289a53f/README.md": "hello from widget" },
  { compress: "gzip" }
).bytes()

const roots: Array<string> = []

afterEach(() => {
  for (const root of roots.splice(0)) rmSync(root, { recursive: true, force: true })
})

const makeRoot = () => {
  const root = mkdtempSync(join(tmpdir(), "scout-test-"))
  roots.push(root)

  return root
}

const makeGitHub = () => {
  const calls = { tarball: 0 }
  const remote = { sha }

  const layer = Layer.succeed(
    GitHub,
    GitHub.of({
      defaultBranch: () => Effect.succeed("main"),
      resolve: () => Effect.sync(() => remote.sha),
      tarball: () => Effect.sync(() => {
        calls.tarball++

        return tarball
      })
    })
  )

  return { calls, remote, layer }
}

const withCache = <A, E>(
  root: string,
  github: Layer.Layer<GitHub>,
  use: (cache: SnapshotCache["Service"]) => Effect.Effect<A, E>
) =>
  Effect.gen(function* () {
    return yield* use(yield* SnapshotCache)
  }).pipe(
    Effect.provide(SnapshotCache.layer(root)),
    Effect.provide(Layer.mergeAll(github, BunFileSystem.layer, BunPath.layer)),
    Effect.provide(TestClock.layer())
  )

const add = (root: string, github: Layer.Layer<GitHub>, selection: Option.Option<Selection>) =>
  withCache(root, github, (cache) => cache.add(repository, selection))

test("downloads a snapshot of the selected branch", async () => {
  const root = makeRoot()
  const result = await Effect.runPromise(add(root, makeGitHub().layer, Option.some(main)))

  expect(result._tag).toBe("Downloaded")
  expect(result.snapshot.selection).toEqual(main)
  expect(result.snapshot.sha).toBe(sha)
  expect(await Bun.file(join(result.snapshot.path, "README.md")).text()).toBe("hello from widget")
})

test("selects the default branch when no selection is given", async () => {
  const root = makeRoot()
  const result = await Effect.runPromise(add(root, makeGitHub().layer, Option.none()))

  expect(result.snapshot.selection).toEqual(main)
})

test("keeps an existing snapshot instead of downloading again", async () => {
  const root = makeRoot()
  const github = makeGitHub()
  const first = await Effect.runPromise(add(root, github.layer, Option.some(main)))
  const second = await Effect.runPromise(add(root, github.layer, Option.some(main)))

  expect(second._tag).toBe("AlreadyCached")
  expect(second.snapshot).toEqual(first.snapshot)
  expect(github.calls.tarball).toBe(1)
})

test("lets GitHub errors through", async () => {
  const root = makeRoot()

  const github = Layer.succeed(
    GitHub,
    GitHub.of({
      defaultBranch: () => Effect.fail(new RepositoryNotFound({ repository })),
      resolve: () => Effect.fail(new RepositoryNotFound({ repository })),
      tarball: () => Effect.succeed(tarball)
    })
  )

  const error = await Effect.runPromise(Effect.flip(add(root, github, Option.none())))

  expect(error._tag).toBe("RepositoryNotFound")
})

test("lists nothing when the cache is empty", async () => {
  const root = makeRoot()
  const snapshots = await Effect.runPromise(withCache(root, makeGitHub().layer, (cache) => cache.list(Option.none())))

  expect(snapshots).toEqual([])
})

test("lists the snapshots of repositories matching the query", async () => {
  const root = makeRoot()
  const github = makeGitHub().layer

  const snapshots = await Effect.runPromise(withCache(root, github, (cache) =>
    Effect.gen(function* () {
      const widget = yield* cache.add(repository, Option.some(main))

      yield* cache.add({ owner: "acme", name: "gadget" }, Option.some(main))

      return { widget, listed: yield* cache.list(Option.some("WIDGET")) }
    })))

  expect(snapshots.listed).toEqual([snapshots.widget.snapshot])
})

test("leaves a branch alone while it is within the TTL", async () => {
  const root = makeRoot()

  const results = await Effect.runPromise(withCache(root, makeGitHub().layer, (cache) =>
    Effect.gen(function* () {
      yield* cache.add(repository, Option.some(main))
      yield* TestClock.adjust("30 minutes")

      return yield* cache.update(repository)
    })))

  expect(results.map((result) => result._tag)).toEqual(["Fresh"])
})

test("refreshes fetchedAt when a stale branch has not moved", async () => {
  const root = makeRoot()
  const github = makeGitHub()

  const results = await Effect.runPromise(withCache(root, github.layer, (cache) =>
    Effect.gen(function* () {
      yield* cache.add(repository, Option.some(main))
      yield* TestClock.adjust(branchTtl)
      yield* TestClock.adjust("1 minute")

      return { updated: yield* cache.update(repository), listed: yield* cache.list(Option.none()) }
    })))

  expect(results.updated.map((result) => result._tag)).toEqual(["Unchanged"])
  expect(results.listed).toEqual(results.updated.map((result) => result.snapshot))
  expect(github.calls.tarball).toBe(1)
})

test("publishes a new revision when a stale branch has moved", async () => {
  const root = makeRoot()
  const github = makeGitHub()

  const results = await Effect.runPromise(withCache(root, github.layer, (cache) =>
    Effect.gen(function* () {
      const added = yield* cache.add(repository, Option.some(main))

      github.remote.sha = newerSha
      yield* TestClock.adjust("2 hours")

      return { added, updated: yield* cache.update(repository), listed: yield* cache.list(Option.none()) }
    })))

  const [updated] = results.updated

  expect(updated?._tag).toBe("Updated")
  expect(updated?.snapshot.sha).toBe(newerSha)
  expect(updated?.snapshot.path).not.toBe(results.added.snapshot.path)
  expect(results.listed).toEqual(results.updated.map((result) => result.snapshot))
})

test("never updates tags", async () => {
  const root = makeRoot()

  const results = await Effect.runPromise(withCache(root, makeGitHub().layer, (cache) =>
    Effect.gen(function* () {
      yield* cache.add(repository, Option.some(v1))
      yield* TestClock.adjust("2 hours")

      return yield* cache.update(repository)
    })))

  expect(results).toEqual([])
})

test("removes one selection or the whole repository", async () => {
  const root = makeRoot()

  const results = await Effect.runPromise(withCache(root, makeGitHub().layer, (cache) =>
    Effect.gen(function* () {
      const branch = yield* cache.add(repository, Option.some(main))
      const tag = yield* cache.add(repository, Option.some(v1))
      const removedTag = yield* cache.remove(repository, Option.some(v1))
      const afterTag = yield* cache.list(Option.none())
      const removedRest = yield* cache.remove(repository, Option.none())

      return { branch, tag, removedTag, afterTag, removedRest, afterAll: yield* cache.list(Option.none()) }
    })))

  expect(results.removedTag).toEqual([results.tag.snapshot])
  expect(results.afterTag).toEqual([results.branch.snapshot])
  expect(results.removedRest).toEqual([results.branch.snapshot])
  expect(results.afterAll).toEqual([])
})
