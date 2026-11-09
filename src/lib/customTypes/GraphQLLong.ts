import { GraphQLScalarType, valueFromASTUntyped } from "graphql"

const MAX_LONG = Number.MAX_SAFE_INTEGER
const MIN_LONG = Number.MIN_SAFE_INTEGER

// Clients build minor-unit amounts as `dollars * 100`, and binary floating point
// lands that just under the whole number — $19.99 arrives as 1998.9999999999998.
// Rounding is what keeps that a cent, where truncating quietly drops one.
const coerceLong = (value) => {
  // Number() reads a boolean as 1 or 0, and null and [] as 0, none of which a
  // caller can have meant by an amount.
  if (
    (typeof value !== "number" && typeof value !== "string") ||
    value === ""
  ) {
    throw new TypeError(
      "Long cannot represent non 52-bit signed integer value: (empty string or NaN)"
    )
  }

  const num = Math.round(Number(value))
  if (Number.isFinite(num) && num <= MAX_LONG && num >= MIN_LONG) {
    return num
  }

  throw new TypeError(
    `Long cannot represent non 52-bit signed integer value: ${value}`
  )
}

export const GraphQLLong = new GraphQLScalarType({
  name: "Long",
  description: "The `Long` scalar type represents 52-bit signed integers",
  serialize: coerceLong,
  parseValue: coerceLong,
  // Inline literals coerce the same way variables do. Reached only when schema
  // stitching is off; incrementalMergeSchemas rebuilds this scalar and routes
  // literals through parseValue itself.
  parseLiteral: (ast) => coerceLong(valueFromASTUntyped(ast)),
})
