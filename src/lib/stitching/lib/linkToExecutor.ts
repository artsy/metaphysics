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
        // Wrap the resolver context as `{ graphqlContext }` to match the v5
        // shape every link's `setContext` callback destructures (see
        // `src/lib/stitching/{exchange,vortex,causality,diffusion}/link.ts`).
        // Without this, all stitched services received `graphqlContext =
        // undefined` and silently fell back to the unauthenticated path —
        // exchange threw outright on `graphqlContext.appToken` access.
        context: { graphqlContext: context },
      })
    )
  }) as Executor
}
