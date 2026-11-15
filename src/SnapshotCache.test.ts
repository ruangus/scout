import { BunFileSystem, BunPath } from "@effect/platform-bun"
import { afterEach, expect, test } from "bun:test"
import { Effect, Layer, Option, Schema } from "effect"
import { mkdtempSync, rmSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { Selection, Sha, type Repository } from "./domain.ts"
import { GitHub, RepositoryNotFound } from "./GitHub.ts"
import { SnapshotCache } from "./SnapshotCache.ts"

const repository: Repository = { owner: "acme", name: "widget" }
const sha = Schema.decodeUnknownSync(Sha)("289a53f7b1fc40049219c6e69022db2fb859c356")
const main = Selection.cases.Branch.make({ name: "main" })

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

  const layer = Layer.succeed(
    GitHub,
    GitHub.of({
      defaultBranch: () => Effect.succeed("main"),
      resolve: () => Effect.succeed(sha),
      tarball: () => Effect.sync(() => {
        calls.tarball++

        return tarball
      })
    })
  )

  return { calls, layer }
}

const add = (root: string, github: Layer.Layer<GitHub>, selection: Option.Option<Selection>) =>
  Effect.gen(function* () {
    const cache = yield* SnapshotCache

    return yield* cache.add(repository, selection)
  }).pipe(
    Effect.provide(SnapshotCache.layer(root)),
    Effect.provide(Layer.mergeAll(github, BunFileSystem.layer, BunPath.layer))
  )

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
