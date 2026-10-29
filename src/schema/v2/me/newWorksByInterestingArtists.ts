import { GraphQLFieldConfig, GraphQLInt } from "graphql"
import { connectionFromArraySlice } from "graphql-relay"
import { convertConnectionArgsToGravityArgs } from "lib/helpers"
import { CursorPageable, pageable } from "relay-cursor-paging"
import { createPageCursors } from "schema/v2/fields/pagination"
import { ResolverContext } from "types/graphql"
import { artworkConnection } from "schema/v2/artwork"
import { loadVortexForUser } from "lib/loadVortexForUser"

const MAX_ARTISTS = 50
const MAX_ARTWORKS = 100
const MIN_AFFINITY_SCORE = 0.5

export const NewWorksByInterestingArtists: GraphQLFieldConfig<
  void,
  ResolverContext
> = {
  description:
    "A connection of new works by artists the user interacted with (sorted by publication date).",
  type: artworkConnection.connectionType,
  args: pageable({
    page: { type: GraphQLInt },
  }),
  resolve: async (_root, args: CursorPageable, context) => {
    const {
      authenticatedLoaders: { vortexUserArtistAffinitiesLoader },
      artworksLoader,
      xImpersonateUserID,
      userID,
    } = context

    if (!artworksLoader || !vortexUserArtistAffinitiesLoader) return

    const { page, size, offset } = convertConnectionArgsToGravityArgs(args)

    // Fetch artist IDs from Vortex
    const userId = userID || xImpersonateUserID

    const artistIds = (
      await loadVortexForUser(context, "vortexUserArtistAffinitiesLoader", {
        user_id: userId,
        min_score: MIN_AFFINITY_SCORE,
        limit: MAX_ARTISTS,
      })
    ).map(({ artist_id }) => artist_id)

    // Fetch artworks from ArtworksLoader if the user interacted with any artists
    let artworks = []

    if (artistIds.length) {
      artworks = await artworksLoader({
        artist_ids: artistIds,
        sort: "-published_at",
        availability: "for sale",
        size,
        offset,
      })
    }

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
