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
import { artistConnection } from "schema/v2/artist"
import {
  getBackfillArtists,
  artistRecommendations,
  getArtistRecommendations,
} from "./helpers"

const MAX_ARTISTS = 10

export const artistsForUser: GraphQLFieldConfig<void, ResolverContext> = {
  description: "A connection of recommended artists for a user.",
  type: artistConnection.connectionType,
  args: pageable({
    includeBackfill: { type: new GraphQLNonNull(GraphQLBoolean) },
    page: { type: GraphQLInt },
    userId: { type: GraphQLString },
    version: { type: GraphQLString },
    maxWorksPerArtist: { type: GraphQLInt },
  }),
  resolve: async (_root, args: CursorPageable, context) => {
    if (!context.artistsLoader) return

    const artistIds = await artistRecommendations(args, context)

    const gravityArgs = convertConnectionArgsToGravityArgs(args)
    const { page, size, offset } = gravityArgs

    const artistRecs = await getArtistRecommendations(
      artistIds,
      gravityArgs,
      context
    )

    const remainingSize = (gravityArgs.size || 0) - artistRecs.length
    const backfillArtists = await getBackfillArtists(
      remainingSize,
      args.includeBackfill,
      context
    )

    const artists = [...artistRecs, ...backfillArtists]

    // TODO: get count from artworks loader to optimize pagination
    const count = artists.length === 0 ? 0 : MAX_ARTISTS

    return {
      totalCount: count,
      pageCursors: createPageCursors({ ...args, page, size }, count),
      ...connectionFromArraySlice(artists, args, {
        arrayLength: count,
        sliceStart: offset ?? 0,
      }),
    }
  },
}
