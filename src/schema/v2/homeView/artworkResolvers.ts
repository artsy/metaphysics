import type { GraphQLFieldResolver } from "graphql"
import type { ResolverContext } from "types/graphql"
import { artworksForUser } from "../artworksForUser"
import { RecentlyViewedArtworks } from "../me/recentlyViewedArtworks"

/*
 * Resolvers for home view artwork sections
 */

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
