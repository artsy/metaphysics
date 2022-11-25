import { GraphQLScalarType } from "graphql"
import { Kind } from "graphql/language"

export const Long = new GraphQLScalarType({
  name: "Long",
  description: "Custom 52-bit Int",
  serialize: (x) => x,
  parseValue: (x) => x,
  parseLiteral: (ast) => {
    console.log("ast.kindast.kindast.kind = ", ast.kind)
    if (ast.kind === Kind.INT) {
      return parseInt(ast.value, 10)
    }
    return null /// Maybe throw an error throw new GraphQLError(error, [ast])
  },
})
