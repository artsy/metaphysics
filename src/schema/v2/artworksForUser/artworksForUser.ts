import {
  GraphQLBoolean,
  GraphQLFieldConfig,
  GraphQLInt,
  GraphQLNonNull,
  GraphQLString,
} from "graphql"
import { connectionFromArraySlice } from "graphql-relay"
import { convertConnectionArgsToGravityArgs } from "lib/helpers"
import { CursorPageable, pageable } from "relay-cursor-paging"
import { createPageCursors } from "schema/v2/fields/pagination"
import { ResolverContext } from "types/graphql"
import { artworkConnection } from "schema/v2/artwork"
import {
  getBackfillArtworks,
  getNewForYouArtworks,
  getNewForYouArtworkIDs,
  getDislikedArtworkIds,
} from "./helpers"

const MAX_ARTWORKS = 100

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
    onlyAtAuction: {
      type: GraphQLBoolean,
      defaultValue: false,
    },
  }),
  resolve: async (_root, args: CursorPageable, context) => {
    // Receive disliked artwork ids to exclude them from recommendations.
    const dislikedArtworkIds = await getDislikedArtworkIds(context)
    const newForYouArtworkIds = await getNewForYouArtworkIDs(args, context)

    const gravityArgs = convertConnectionArgsToGravityArgs(args)
    const { page, size, offset } = gravityArgs

    let newForYouArtworks = await getNewForYouArtworks(
      {
        ids: newForYouArtworkIds,
        marketable: args.marketable,
      },
      gravityArgs,
      context
    )
    // We filter out disliked artworks 2 times - here and after receiving backfilled artworks.
    // We do this so that remaningSize option for getBackfillArtworks
    // is calculated correctly.
    newForYouArtworks = newForYouArtworks.filter(
      (artwork) => !dislikedArtworkIds.includes(artwork._id)
    )

    const remainingSize = (gravityArgs.size || 0) - newForYouArtworks.length
    const backfillArtworks = await getBackfillArtworks(
      remainingSize,
      args.includeBackfill,
      context,
      args.onlyAtAuction
    )

    const artworks = [...newForYouArtworks, ...backfillArtworks].filter(
      (artwork) => !dislikedArtworkIds.includes(artwork._id)
    )

    // TODO: get count from artworks loader to optimize pagination
    const count = artworks.length === 0 ? 0 : MAX_ARTWORKS

    return {
      totalCount: count,
      pageCursors: createPageCursors({ ...args, page, size }, count),
      ...connectionFromArraySlice(artworks, args, {
        arrayLength: count,
        sliceStart: offset ?? 0,
      }),
    }
  },
}
