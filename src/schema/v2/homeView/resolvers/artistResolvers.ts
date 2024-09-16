import type { GraphQLFieldResolver } from "graphql"
import type { ResolverContext } from "types/graphql"
import { ArtistRecommendations } from "../../me/artistRecommendations"

/*
 * Resolvers for home view artist sections
 */

export const RecommendedArtistsResolver: GraphQLFieldResolver<
  any,
  ResolverContext
> = async (parent, args, context, info) => {
  return await ArtistRecommendations.resolve!(parent, args, context, info)
}
