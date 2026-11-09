import { GraphQLScalarType } from "graphql"
import { Kind } from "graphql/language"

const MAX_LONG = Number.MAX_SAFE_INTEGER
const MIN_LONG = Number.MIN_SAFE_INTEGER

const serializeLong = (value) => {
  if (value !== 0 && value !== "0" && !Number(value)) {
    throw new TypeError(
      "Long cannot represent non 52-bit signed integer value: (empty string or NaN)"
    )
  }
  const num = Number(value)
  if (num <= MAX_LONG && num >= MIN_LONG) {
    if (num < 0) {
      return Math.ceil(num)
    }
    return Math.floor(num)
  }
  throw new TypeError(
    `Long cannot represent non 52-bit signed integer value: ${value}`
  )
}

export const GraphQLLong = new GraphQLScalarType({
  name: "Long",
  description: "The `Long` scalar type represents 52-bit signed integers",
  serialize: serializeLong,
  parseValue: serializeLong,
  // undefined is how GraphQL is told a literal is invalid; null would pass
  // validation and arrive as an explicit null, which callers that read null as
  // "clear this field" cannot tell from a typo. Only reached when stitching is
  // off: incrementalMergeSchemas rebuilds this scalar and routes literals
  // through parseValue instead.
  parseLiteral: (ast) => {
    if (ast.kind !== Kind.INT) return undefined

    const num = parseInt(ast.value, 10)
    if (num > MAX_LONG || num < MIN_LONG) return undefined

    return num
  },
})
