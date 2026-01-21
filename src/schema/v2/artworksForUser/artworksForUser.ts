import {
  GraphQLBoolean,
  GraphQLFieldConfig,
  GraphQLInt,
  GraphQLList,
  GraphQLNonNull,
  GraphQLString,
} from "graphql"
import { connectionFromArraySlice } from "graphql-relay"
import { convertConnectionArgsToGravityArgs } from "lib/helpers"
import { uniqBy } from "lodash"
import { CursorPageable, pageable } from "relay-cursor-paging"
import { artworkConnection } from "schema/v2/artwork"
import { createPageCursors } from "schema/v2/fields/pagination"
import { ResolverContext } from "types/graphql"
import {
  getBackfillArtworks,
  getNewForYouArtworkIDs,
  getNewForYouArtworks,
} from "./helpers"

export const artworksForUser: GraphQLFieldConfig<void, ResolverContext> = {
  description: "A connection of artworks for a user.",
  type: artworkConnection.connectionType,
  args: pageable({
    includeBackfill: { type: new GraphQLNonNull(GraphQLBoolean) },
    page: { type: GraphQLInt },
    userId: { type: GraphQLString },
    version: { type: GraphQLString },
    maxWorksPerArtist: { type: GraphQLInt },
    marketable: { type: GraphQLBoolean },
    marketingCollectionId: {
      type: GraphQLString,
      description:
        "The ID of the marketing collection to be used for backfill (only used together with includeBackfill: true)",
    },
    onlyAtAuction: {
      type: GraphQLBoolean,
      defaultValue: false,
    },
    excludeDislikedArtworks: {
      type: GraphQLBoolean,
      defaultValue: false,
    },
    excludeArtworkIds: {
      type: new GraphQLList(GraphQLString),
      defaultValue: [],
    },
  }),
  resolve: async (_root, args: CursorPageable, context) => {
    const gravityArgs = convertConnectionArgsToGravityArgs(args)
    const { page, size, offset } = gravityArgs

    const newForYouArtworkIds = await getNewForYouArtworkIDs(
      gravityArgs,
      context
    )

    const filteredArtworkIds = newForYouArtworkIds.filter(
      (artworkId) => !args.excludeArtworkIds.includes(artworkId)
    )

    const slicedArtworkIds = filteredArtworkIds.slice(offset, offset + size)

    const newForYouArtworks = await getNewForYouArtworks(
      {
        ids: slicedArtworkIds,
        marketable: args.marketable,
        excludeDislikedArtworks: args.excludeDislikedArtworks,
      },
      gravityArgs,
      context
    )

    const {
      artworks: backfillArtworks,
      totalCount: backfillArtworksTotalCount,
    } = await getBackfillArtworks({
      size: size || 0,
      includeBackfill: args.includeBackfill,
      context,
      marketingCollectionId: args.marketingCollectionId,
      onlyAtAuction: args.onlyAtAuction,
      excludeDislikedArtworks: args.excludeDislikedArtworks,
    })

    const artworks = uniqBy(
      newForYouArtworks.concat(backfillArtworks),
      "id"
    ).slice(0, size)

    const totalCount =
      filteredArtworkIds.length + (backfillArtworksTotalCount ?? 0)

    return {
      totalCount,
      pageCursors: createPageCursors({ ...args, page, size }, totalCount),
      ...connectionFromArraySlice(artworks, args, {
        arrayLength: totalCount,
        sliceStart: offset,
      }),
    }
  },
}
