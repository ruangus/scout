import { BunFileSystem, BunPath } from "@effect/platform-bun"
import { afterEach, expect, test } from "bun:test"
import { Effect, Layer } from "effect"
import { lstatSync, mkdirSync, mkdtempSync, readlinkSync, rmSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { Skill, skillContent } from "./Skill.ts"

const homes: Array<string> = []

afterEach(() => {
  for (const home of homes.splice(0)) rmSync(home, { recursive: true, force: true })
})

const makeHome = () => {
  const home = mkdtempSync(join(tmpdir(), "scout-home-"))
  homes.push(home)

  return home
}

const install = (home: string) =>
  Effect.gen(function* () {
    return yield* (yield* Skill).install
  }).pipe(
    Effect.provide(Skill.layer(home)),
    Effect.provide(Layer.mergeAll(BunFileSystem.layer, BunPath.layer))
  )

test("installs the skill under .agents and links it from .claude", async () => {
  const home = makeHome()
  const result = await Effect.runPromise(install(home))

  expect(result._tag).toBe("Installed")
  expect(await Bun.file(join(home, ".agents/skills/scout/SKILL.md")).text()).toBe(skillContent)
  expect(readlinkSync(join(home, ".claude/skills/scout"))).toBe("../../.agents/skills/scout")
  expect(await Bun.file(join(home, ".claude/skills/scout/SKILL.md")).text()).toBe(skillContent)
})

test("reports Unchanged when the installed skill is current", async () => {
  const home = makeHome()

  await Effect.runPromise(install(home))

  const result = await Effect.runPromise(install(home))

  expect(result._tag).toBe("Unchanged")
})

test("rewrites an outdated skill", async () => {
  const home = makeHome()

  mkdirSync(join(home, ".agents/skills/scout"), { recursive: true })
  writeFileSync(join(home, ".agents/skills/scout/SKILL.md"), "old skill")

  const result = await Effect.runPromise(install(home))

  expect(result._tag).toBe("Installed")
  expect(await Bun.file(join(home, ".agents/skills/scout/SKILL.md")).text()).toBe(skillContent)
})

test("leaves something else at the .claude path alone", async () => {
  const home = makeHome()

  mkdirSync(join(home, ".claude/skills/scout"), { recursive: true })

  const error = await Effect.runPromise(Effect.flip(install(home)))

  expect(error._tag).toBe("SkillConflict")
  expect(lstatSync(join(home, ".claude/skills/scout")).isDirectory()).toBe(true)
})
