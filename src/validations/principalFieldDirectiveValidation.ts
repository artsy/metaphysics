import { GraphQLError, BREAK, ASTVisitor } from "graphql"

export const principalFieldDirectiveValidation = (context): ASTVisitor => {
  let directivesSeen = 0
  return {
    Directive(node) {
      if (node.name.value === "principalField") {
        directivesSeen++
        if (directivesSeen > 1) {
          context.reportError(
            new GraphQLError("Can only use `@principalField` once.")
          )
          return BREAK
        }
      }
    },
  }
}
