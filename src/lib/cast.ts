import { Errors, Type } from "io-ts"
import { zip } from "fp-ts/lib/Array"
import { pipe } from "fp-ts/lib/pipeable"
import { fold } from "fp-ts/lib/Either"
import { identity } from "fp-ts/lib/function"

export type Context = Record<string, { expected: string; actual: unknown }>

export const formatErrors = (
  errors: Errors
): { paths: string[]; context: Context[] } => {
  const paths = errors.map(error =>
    error.context
      .slice(1)
      .map(({ key }) => key)
      .join(".")
  )

  const context = zip(errors, paths).map(([error, key]) => {
    const { type, actual } = error.context[error.context.length - 1]

    return {
      [key]: {
        expected: type.name,
        actual: actual || null,
      },
    }
  })

  return { paths, context }
}
export const cast = <A, O, I>(codec: Type<A, O, I>, value: I): A => {
  return pipe(
    codec.decode(value),

    fold(errors => {
      const { paths } = formatErrors(errors)

      throw new Error(
        `Error decoding field${paths.length === 1 ? "" : "s"} "${paths.join(
          ", "
        )}"`
      )
    }, identity)
  )
}
