import type { GraphQLFieldResolver } from "graphql"
import type { ResolverContext } from "types/graphql"
import ArticlesConnection from "../articlesConnection"

/*
 * Resolvers for home view articels sections
 */

export const LatestArticlesResolvers: GraphQLFieldResolver<
  any,
  ResolverContext
> = ArticlesConnection.resolve!
