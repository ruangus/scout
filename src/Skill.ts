import { Context, Effect, FileSystem, Layer, Option, Path, Schema } from "effect";
import skill from "../.agents/skills/scout/SKILL.md" with { type: "text" }
import { readFailed, writeFailed, type ReadFailed, type WriteFailed } from "./FileErrors.ts"

export const skillContent = skill

export const SkillInstallResult = Schema.TaggedUnion({
  Installed: { skill: Schema.String, link: Schema.String },
  Unchanged: { skill: Schema.String, link: Schema.String }
})

export type SkillInstallResult = typeof SkillInstallResult.Type

export class SkillConflict extends Schema.TaggedError<SkillConflict>()("SkillConflict", {
  path: Schema.String
}) {}

export class Skill extends Context.Service<Skill, {
  readonly install: Effect.Effect<SkillInstallResult, SkillConflict | ReadFailed | WriteFailed>
}>()("scout/Skill") {
  static readonly layer = (home: string) =>
    Layer.effect(
      Skill,
      Effect.gen(function* () {
        const fs = yield* FileSystem.FileSystem
        const path = yield* Path.Path

        const skillDirectory = path.join(home, ".agents", "skills", "scout")
        const skillFile = path.join(skillDirectory, "SKILL.md")
        const link = path.join(home, ".claude", "skills", "scout")
        const linkTarget = path.relative(path.dirname(link), skillDirectory)

        const needsLink = Effect.fnUntraced(function* () {
          const target = yield* fs.readLink(link).pipe(Effect.option)

          if (Option.isSome(target)) {
            if (target.value === linkTarget) return false

            return yield* new SkillConflict({ path: link })
          }

          const occupied = yield* fs.exists(link).pipe(Effect.mapError(readFailed(link)))

          if (occupied) return yield* new SkillConflict({ path: link })

          return true
        })

        const needsWrite = Effect.fnUntraced(function* () {
          const exists = yield* fs.exists(skillFile).pipe(Effect.mapError(readFailed(skillFile)))

          if (!exists) return true

          const current = yield* fs.readFileString(skillFile).pipe(Effect.mapError(readFailed(skillFile)))

          return current !== skillContent
        })

        const install = Effect.gen(function* () {
          const linkMissing = yield* needsLink()
          const outdated = yield* needsWrite()

          if (outdated) {
            const temporary = `${skillFile}.tmp`

            yield* fs.makeDirectory(skillDirectory, { recursive: true }).pipe(Effect.mapError(writeFailed(skillDirectory)))
            yield* fs.writeFileString(temporary, skillContent).pipe(Effect.mapError(writeFailed(temporary)))
            yield* fs.rename(temporary, skillFile).pipe(Effect.mapError(writeFailed(skillFile)))
          }

          if (linkMissing) {
            yield* fs.makeDirectory(path.dirname(link), { recursive: true }).pipe(Effect.mapError(writeFailed(link)))
            yield* fs.symlink(linkTarget, link).pipe(Effect.mapError(writeFailed(link)))
          }

          const paths = { skill: skillFile, link }

          return outdated || linkMissing
            ? SkillInstallResult.cases.Installed.make(paths)
            : SkillInstallResult.cases.Unchanged.make(paths)
        }).pipe(Effect.withSpan("Skill.install"))

        return Skill.of({ install })
      })
    )
}
