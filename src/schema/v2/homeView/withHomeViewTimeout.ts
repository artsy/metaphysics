import config from "config"
import { GraphQLFieldResolver } from "graphql"
import { withTimeout } from "lib/loaders/helpers"
import { ResolverContext } from "types/graphql"

export const withHomeViewTimeout = (
  resolver: GraphQLFieldResolver<any, ResolverContext>,
  timeout: number = config.HOME_VIEW_RESOLVER_TIMEOUT_MS
): GraphQLFieldResolver<any, ResolverContext> => {
  return async (parent, args, context, info) => {
    return await withTimeout(resolver(parent, args, context, info), timeout)
  }
}
