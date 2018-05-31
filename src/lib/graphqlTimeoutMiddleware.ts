import { IMiddleware } from "graphql-middleware"
import { GraphQLResolveInfo, GraphQLField } from "graphql"
import invariant from "invariant"

export function fieldFromResolveInfo(resolveInfo: GraphQLResolveInfo) {
  return resolveInfo.parentType.getFields()[resolveInfo.fieldName]
}

export function timeoutForField(field: GraphQLField<any, any>) {
  const fieldDirectives = field.astNode && field.astNode.directives
  const directive = fieldDirectives && fieldDirectives.find(directive => directive.name.value === "timeout")
  if (directive) {
    const args = directive && directive.arguments
    const arg = args && args[0]
    invariant(arg && arg.name.value === "ms", "graphqlTimeoutMiddleware: The `@timeout(ms: …)` argument is required.")
    const value = arg!.value
    if (value.kind === "IntValue") {
      return parseInt(value.value)
    } else {
      invariant(false, `graphqlTimeoutMiddleware: Expected \`@timeout(ms: …)\` to be a \`IntValue\`, got \`${value.kind}\` instead.`)
      return null
    }
  }
  return null
}

export const graphqlTimeoutMiddleware = (defaultTimeoutInMS: number) => {
  const middleware: IMiddleware = (
    middlewareResolver,
    parent,
    args,
    context,
    info
  ) => {
    // TODO: Maybe cache if it turns out to take significant time.
    //       Should probably be cached on the schema instance.
    const timeoutInMS = timeoutForField(fieldFromResolveInfo(info)) || defaultTimeoutInMS
    return Promise.race([
      new Promise((_resolve, reject) => {
        setTimeout(() => {
          const field = `${info.parentType}.${info.fieldName}`;
          reject(new Error(`GraphQL Error: ${field} has timed out after waiting for ${timeoutInMS}ms`))
        }, timeoutInMS)
      }),
      new Promise(resolve => resolve(middlewareResolver(parent, args, context, info))),
    ])
  }
  return middleware
}
