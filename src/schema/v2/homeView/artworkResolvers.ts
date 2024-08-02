import type { GraphQLFieldResolver } from "graphql"
import type { ResolverContext } from "types/graphql"
import { artworksForUser } from "../artworksForUser"
import { convertConnectionArgsToGravityArgs } from "lib/helpers"
import { paginationResolver } from "../fields/pagination"
import { RecentlyViewedArtworks } from "../me/recentlyViewedArtworks"

/*
 * Resolvers for home view artwork sections
 */

// the resolvers

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
> = async (_parent, args, _context, _info) => {
  // TODO: use actual loader

  const stubData = [{ id: "TODO-auction_lots_for_you" }]
  const { page, size, offset } = convertConnectionArgsToGravityArgs(args)
  const data = stubData.slice(offset, offset + size)
  const totalCount = stubData.length

  return paginationResolver({
    totalCount,
    offset,
    page,
    size,
    body: data,
    args,
  })
}
