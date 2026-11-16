import { expect, test } from "bun:test"
import { Schema } from "effect"
import { ConflictingSelectors, InvalidSha } from "./domain.ts"

const cli = new URL("./cli.ts", import.meta.url).pathname

const scout = (...args: Array<string>) => {
  const result = Bun.spawnSync(["bun", cli, ...args])

  return { exitCode: result.exitCode, stdout: result.stdout.toString(), stderr: result.stderr.toString() }
}

const decodeStderr = <S extends Schema.Top & { readonly DecodingServices: never }>(schema: S, stderr: string) =>
  Schema.decodeUnknownSync(Schema.fromJsonString(Schema.toCodecJson(schema)))(stderr)

test.each([
  ["add", "https://github.com/effect-ts/effect"],
  ["remove", "effect-ts/effect"]
])("scout %s with a short commit sha prints InvalidSha on stderr only", (command, repository) => {
  const result = scout(command, repository, "--commit", "553c78f")

  expect(result.exitCode).toBe(1)
  expect(result.stdout).toBe("")
  expect(decodeStderr(InvalidSha, result.stderr)).toEqual(new InvalidSha({ sha: "553c78f" }))
})

test("scout add with two selectors prints ConflictingSelectors on stderr only", () => {
  const result = scout("add", "https://github.com/effect-ts/effect", "--tag", "v1", "--branch", "main")

  expect(result.exitCode).toBe(1)
  expect(result.stdout).toBe("")
  expect(decodeStderr(ConflictingSelectors, result.stderr)).toEqual(new ConflictingSelectors({ selectors: ["branch", "tag"] }))
})
