import type { GraphQLFieldResolver } from "graphql"
import { connectionFromArray } from "graphql-relay"
import type { ResolverContext } from "types/graphql"
import { getCuratedArtists } from "../artists/curatedTrending"
import { artworksForUser } from "../artworksForUser"
import { RecentlyViewedArtworks } from "../me/recentlyViewedArtworks"
import { SimilarToRecentlyViewed } from "../me/similarToRecentlyViewed"

/*
 * Resolvers for home view artwork sections
 */

export const SimilarToRecentlyViewedArtworksResolver: GraphQLFieldResolver<
  any,
  ResolverContext
> = async (parent, args, context, info) => {
  if (!context.meLoader) return []

  const { recently_viewed_artwork_ids } = await context.meLoader()

  if (recently_viewed_artwork_ids.length === 0) {
    return []
  }
  const recentlyViewedIds = recently_viewed_artwork_ids.slice(0, 7)

  return SimilarToRecentlyViewed.resolve!(
    { ...parent, recently_viewed_artwork_ids: recentlyViewedIds },
    args,
    context,
    info
  )
}

export const NewWorksForYouResolver: GraphQLFieldResolver<
  any,
  ResolverContext
> = async (parent, args, context, info) => {
  const finalArgs = {
    // formerly specified client-side
    maxWorksPerArtist: 3,
    includeBackfill: true,
    first: args.first,
    version: "C",
    excludeDislikedArtworks: true,
    excludeArtworkIds: [],

    ...args,
  }

  const result = await artworksForUser.resolve!(
    parent,
    finalArgs,
    context,
    info
  )

  return result
}

export const RecentlyViewedArtworksResolver: GraphQLFieldResolver<
  any,
  ResolverContext
> = async (_parent, args, context, info) => {
  if (!context.meLoader)
    throw new Error("You need to be signed in to perform this action")

  const me = await context.meLoader()

  return RecentlyViewedArtworks.resolve!(me, args, context, info)
}

export const AuctionLotsForYouResolver: GraphQLFieldResolver<
  any,
  ResolverContext
> = async (parent, args, context, info) => {
  const finalArgs = {
    // formerly specified client-side
    includeBackfill: true,
    onlyAtAuction: true,
    first: args.first,
    excludeDislikedArtworks: true,
    excludeArtworkIds: [],

    ...args,
  }

  const result = await artworksForUser.resolve!(
    parent,
    finalArgs,
    context,
    info
  )

  return result
}

export const SuggestedArtistsResolver: GraphQLFieldResolver<
  any,
  ResolverContext
> = async (_parent, args, context, _info) => {
  const artistRecords = await getCuratedArtists(context)
  return connectionFromArray(artistRecords, args)
}
