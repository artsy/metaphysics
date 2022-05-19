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
import { createPageCursors } from "schema/v1/fields/pagination"
import { ResolverContext } from "types/graphql"
import { artworkConnection } from "schema/v2/artwork"
import {
  getArtistAffinities,
  getAffinityArtworks,
  getBackfillArtworks,
} from "./helpers"

const MAX_ARTWORKS = 100

export const artworksForUser: GraphQLFieldConfig<void, ResolverContext> = {
  description: "A connection of artworks for a user.",
  type: artworkConnection.connectionType,
  args: pageable({
    includeBackfill: { type: new GraphQLNonNull(GraphQLBoolean) },
    page: { type: GraphQLInt },
    userId: { type: GraphQLString },
  }),
  resolve: async (_root, args: CursorPageable, context) => {
    if (!context.artworksLoader) return

    const artistIds = await getArtistAffinities(args, context)

    const gravityArgs = convertConnectionArgsToGravityArgs(args)
    const { page, size, offset } = gravityArgs

    const affinityArtworks = await getAffinityArtworks(
      artistIds,
      gravityArgs,
      context
    )

    const remainingSize = (gravityArgs.size || 0) - affinityArtworks.length
    const backfillArtworks = await getBackfillArtworks(
      remainingSize,
      args.includeBackfill,
      context
    )

    const artworks = [...affinityArtworks, ...backfillArtworks]

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
