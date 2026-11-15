import { expect, test } from "bun:test"
import { Schema } from "effect"
import { RepositoryName, RepositoryUrl } from "./domain.ts"

const decode = Schema.decodeUnknownSync(RepositoryUrl)

test.each([
  "https://github.com/effect-ts/effect",
  "https://github.com/effect-ts/effect/",
  "https://github.com/effect-ts/effect.git",
  "github.com/effect-ts/effect"
])("parses %s", (url) => {
  expect(decode(url)).toEqual({ owner: "effect-ts", name: "effect" })
})

test.each([
  "effect",
  "https://gitlab.com/effect-ts/effect",
  "https://github.com/effect-ts",
  "https://github.com/effect-ts/effect/tree/main"
])("rejects %s", (url) => {
  expect(() => decode(url)).toThrow()
})

test("parses owner/repo", () => {
  expect(Schema.decodeUnknownSync(RepositoryName)("effect-ts/effect")).toEqual({ owner: "effect-ts", name: "effect" })
})

test.each(["effect", "effect-ts/effect/extra", "https://github.com/effect-ts/effect"])("rejects %s as owner/repo", (name) => {
  expect(() => Schema.decodeUnknownSync(RepositoryName)(name)).toThrow()
})
