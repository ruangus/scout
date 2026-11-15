import { Schema } from "effect";

export class ReadFailed extends Schema.TaggedError<ReadFailed>()("ReadFailed", {
  path: Schema.String,
  cause: Schema.Defect()
}) {}

export class WriteFailed extends Schema.TaggedError<WriteFailed>()("WriteFailed", {
  path: Schema.String,
  cause: Schema.Defect()
}) {}

export const readFailed = (path: string) => (cause: unknown) => new ReadFailed({ path, cause })

export const writeFailed = (path: string) => (cause: unknown) => new WriteFailed({ path, cause })
