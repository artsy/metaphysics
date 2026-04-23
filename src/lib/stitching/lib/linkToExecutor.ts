import { execute, ApolloLink, makePromise } from "apollo-link"
import type { Executor } from "@graphql-tools/utils"

// Minimal adapter so `@graphql-tools/wrap`'s `wrapSchema` can use an Apollo
// Link chain as the remote executor. Replaces `@graphql-tools/links` which
// pulls in an `@apollo/client` dep chain we don't want.
export function linkToExecutor(link: ApolloLink): Executor {
  return (async ({ document, variables, operationName, context }) => {
    return await makePromise(
      execute(link, {
        query: document,
        variables: variables ?? {},
        operationName,
        context,
      })
    )
  }) as Executor
}
