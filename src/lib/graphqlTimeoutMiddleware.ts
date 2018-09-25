import { IMiddleware } from "graphql-middleware"
import { GraphQLResolveInfo, GraphQLField } from "graphql"
import invariant from "invariant"

export class GraphQLTimeoutError extends Error {
  constructor(message) {
    super(message)
    Error.captureStackTrace(this, this.constructor)
  }
}

export function fieldFromResolveInfo(resolveInfo: GraphQLResolveInfo) {
  return resolveInfo.parentType.getFields()[resolveInfo.fieldName]
}

export function timeoutForField(field: GraphQLField<any, any>) {
  const fieldDirectives = field.astNode && field.astNode.directives
  const directive =
    fieldDirectives &&
    fieldDirectives.find(directive => directive.name.value === "timeout")
  if (directive) {
    const args = directive && directive.arguments
    const arg = args && args[0]
    invariant(
      arg && arg.name.value === "ms",
      "graphqlTimeoutMiddleware: The `@timeout(ms: …)` argument is required."
    )
    const value = arg!.value
    if (value.kind === "IntValue") {
      return parseInt(value.value)
    } else {
      invariant(
        false,
        `graphqlTimeoutMiddleware: Expected \`@timeout(ms: …)\` to be a \`IntValue\`, got \`${
          value.kind
        }\` instead.`
      )
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
    const timeoutInMS =
      timeoutForField(fieldFromResolveInfo(info)) || defaultTimeoutInMS
    let timeoutID
    return Promise.race([
      new Promise((_resolve, reject) => {
        timeoutID = setTimeout(() => {
          const field = `${info.parentType}.${info.fieldName}`
          reject(
            new GraphQLTimeoutError(
              `GraphQL Timeout Error: ${field} has timed out after waiting for ${timeoutInMS}ms`
            )
          )
        }, timeoutInMS)
      }),
      new Promise(async (resolve, reject) => {
        try {
          const result = await middlewareResolver(parent, args, context, info)
          resolve(result)
        } catch (error) {
          reject(error)
        } finally {
          clearTimeout(timeoutID)
        }
      }),
    ])
  }
  return middleware
}
