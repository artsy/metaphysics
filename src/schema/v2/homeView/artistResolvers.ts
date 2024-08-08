import type { GraphQLFieldResolver } from "graphql"
import { connectionFromArray } from "graphql-relay"
import type { ResolverContext } from "types/graphql"
import { getCuratedArtists } from "../artists/curatedTrending"
import { ArtistRecommendations } from "../me/artistRecommendations"

/*
 * Resolvers for home view artist sections
 */

export const SuggestedArtistsResolver: GraphQLFieldResolver<
  any,
  ResolverContext
> = async (_parent, args, context, _info) => {
  const artistRecords = await getCuratedArtists(context)
  return connectionFromArray(artistRecords, args)
}

export const RecommendedArtistsResolver: GraphQLFieldResolver<
  any,
  ResolverContext
> = async (parent, args, context, info) => {
  return await ArtistRecommendations.resolve!(parent, args, context, info)
}
