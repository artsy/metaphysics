import { GraphQLError, BREAK } from "graphql"

export const canonicalResourceDirectiveValidation = context => {
  let canonicalDirectivesSeen = 0
  return {
    Directive(node) {
      if (node.name.value === "canonicalResource") {
        canonicalDirectivesSeen++
        if (canonicalDirectivesSeen > 1) {
          context.reportError(
            new GraphQLError("Can only use `@canonicalResource` once.")
          )
          return BREAK
        }
      }
    },
  }
}
