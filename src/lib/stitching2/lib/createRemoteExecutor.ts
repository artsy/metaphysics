import fetch from "node-fetch"
import { print } from "graphql"
import { ExecutionParams, Executor } from "@graphql-tools/delegate"
import { ResolverContext } from "types/graphql"

/**
 * The parameter that's passed down to an executor's middleware
 */
interface ExecutorMiddlewareOperationParameter
  extends ExecutionParams<unknown, ResolverContext> {
  /** The operation's parsed result payload */
  result: unknown
  /** A stringified representation of the operation */
  text: string
}

export type ExecutorMiddleware = (
  operation: ExecutorMiddlewareOperationParameter
) => ExecutorMiddlewareOperationParameter

interface ExecutorOptions {
  /** Middleware runs at the end of the operation execution */
  middleware?: ExecutorMiddleware[]
}

/**
 *
 * @param graphqlURI URI to the remote graphql service
 * @param options Object used to specify middleware or other configuration for the executor
 */
export const createRemoteExecutor = (
  graphqlURI: string,
  options: ExecutorOptions = {}
) => {
  const { middleware = [] } = options

  return async ({
    document,
    variables,
    ...otherOptions
  }): Promise<Executor> => {
    const query = print(document)
    const fetchResult = await fetch(graphqlURI, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ query, variables }),
    })
    const result = await fetchResult.json()
    if (middleware.length) {
      return middleware.reduce(
        (acc, middleware) =>
          middleware({
            document,
            variables,
            text: query,
            result: acc,
            ...otherOptions,
          }),
        result
      ).result
    }
    return result
  }
}
