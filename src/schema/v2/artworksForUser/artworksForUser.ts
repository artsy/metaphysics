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

// Because we're currently not able to use pagination with the Vortex API GraphQL endpoint.
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
      context,
      MAX_ARTWORKS
    )
    const filteredArtworkIds = newForYouArtworkIds.filter(
      (artworkId) => !args.excludeArtworkIds.includes(artworkId)
    )

    const newForYouArtworks = await getNewForYouArtworks(
      {
        ids: filteredArtworkIds,
        marketable: args.marketable,
        excludeDislikedArtworks: args.excludeDislikedArtworks,
      },
      gravityArgs,
      context
    )

    const backfillArtworks = await getBackfillArtworks(
      size || 0,
      args.includeBackfill,
      context,
      args.onlyAtAuction,
      args.excludeDislikedArtworks
    )

    const artworks = uniqBy(
      newForYouArtworks.concat(backfillArtworks),
      "id"
    ).slice(0, size)

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
