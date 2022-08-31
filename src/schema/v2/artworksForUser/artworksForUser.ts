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
  getNewForYouRecs,
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
  }),
  resolve: async (_root, args: CursorPageable, context) => {
    if (!context.artworksLoader) return

    const newForYouArtworkIds = await getNewForYouRecs(args, context)

    const gravityArgs = convertConnectionArgsToGravityArgs(args)
    const { page, size, offset } = gravityArgs

    const newForYouArtworks = await getNewForYouArtworks(
      newForYouArtworkIds,
      gravityArgs,
      context
    )

    const remainingSize = (gravityArgs.size || 0) - newForYouArtworks.length
    const backfillArtworks = await getBackfillArtworks(
      remainingSize,
      args.includeBackfill,
      context
    )

    const artworks = [...newForYouArtworks, ...backfillArtworks]

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
