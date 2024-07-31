import type { GraphQLFieldResolver } from "graphql"
import type { HomeViewSectionKey } from "./getSectionsForUser"
import type { ResolverContext } from "types/graphql"
import { artworksForUser } from "../artworksForUser"
import { convertConnectionArgsToGravityArgs } from "lib/helpers"
import { paginationResolver } from "../fields/pagination"

/*
 * Resolvers for home view artwork sections
 */

// the resolvers

const newWorksForYouResolver: GraphQLFieldResolver<
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

const recentlyViewedArtworksResolver: GraphQLFieldResolver<
  any,
  ResolverContext
> = (_parent, args, _context, _info) => {
  // TODO: use actual loader

  const stubData = [{ id: "TODO-recently_viewed_artworks" }]
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

const auctionLotsForYouResolver: GraphQLFieldResolver<
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

// the section-to-resolver mapping

type SectionResolverMap = Partial<
  Record<HomeViewSectionKey, GraphQLFieldResolver<any, ResolverContext>>
>

export const ARTWORK_RESOLVERS: SectionResolverMap = {
  NEW_WORKS_FOR_YOU: newWorksForYouResolver,
  AUCTION_LOTS_FOR_YOU: auctionLotsForYouResolver,
  RECENTLY_VIEWED_ARTWORKS: recentlyViewedArtworksResolver,
}
