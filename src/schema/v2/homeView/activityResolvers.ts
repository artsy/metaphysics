import type { GraphQLFieldResolver } from "graphql"
import type { ResolverContext } from "types/graphql"
import { NotificationsConnection } from "../notifications"

/*
 * Resolvers for home view activity sections
 */

export const LatestActivityResolver: GraphQLFieldResolver<
  any,
  ResolverContext
> = async (parent, args, context, info) => {
  return await NotificationsConnection.resolve!(parent, args, context, info)
}
