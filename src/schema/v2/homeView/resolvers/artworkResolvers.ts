import type { GraphQLFieldResolver } from "graphql"
import type { ResolverContext } from "types/graphql"
import { artworksForUser } from "../../artworksForUser"
import { newWorksFromGalleriesYouFollow } from "../../me/newWorksFromGalleriesYouFollow"
import { RecentlyViewedArtworks } from "../../me/recentlyViewedArtworks"
import { connectionFromArray } from "graphql-relay"
import { ArtworkRecommendations } from "../../me/artworkRecommendations"

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

export const NewWorksFromGalleriesYouFollowResolver: GraphQLFieldResolver<
  any,
  ResolverContext
> = newWorksFromGalleriesYouFollow.resolve!

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

export const ActiveBidsResolver: GraphQLFieldResolver<
  any,
  ResolverContext
> = async (_parent, args, context, _info) => {
  const { lotStandingLoader } = context

  if (!lotStandingLoader) return []

  let result = await lotStandingLoader({
    live: true,
  })
  result = result.map((res) => res.sale_artwork.artwork)

  return connectionFromArray(result, args)
}

export const RecommendedArtworksResolver: GraphQLFieldResolver<
  any,
  ResolverContext
> = ArtworkRecommendations.resolve!
