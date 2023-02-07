import {
  ASTVisitor,
  GraphQLError,
  FieldNode,
  ValidationContext,
  getNamedType,
  isIntrospectionType,
} from "graphql"

// Adapted from https://github.com/graphql/graphql-js/pull/2600.
// TODO: replace once using graphql >=15.2.0

/**
 * Prohibit introspection queries
 *
 * A GraphQL document is only valid if all fields selected are not fields that
 * return an introspection type.
 *
 * Note: This rule is optional and is not part of the Validation section of the
 * GraphQL Specification. This rule effectively disables introspection, which
 * does not reflect best practices and should only be done if absolutely necessary.
 */
export const NoSchemaIntrospectionCustomRule = (
  context: ValidationContext
): ASTVisitor => {
  return {
    Field(node: FieldNode) {
      const contextType = context.getType()
      if (!contextType) return
      const type = getNamedType(contextType)
      if (type && isIntrospectionType(type)) {
        context.reportError(
          new GraphQLError(
            `GraphQL introspection has been disabled, but the requested query contained the field "${node.name.value}".`,
            node
          )
        )
      }
    },
  }
}
