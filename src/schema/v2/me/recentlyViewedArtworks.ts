import { connectionFromArray, connectionFromArraySlice } from "graphql-relay"
import { pageable } from "relay-cursor-paging"
import { artworkConnection } from "schema/v2/artwork"
import { GraphQLFieldConfig } from "graphql"
import { ResolverContext } from "types/graphql"
import { createPageCursors } from "../fields/pagination"
import { convertConnectionArgsToGravityArgs } from "lib/helpers"

export const RecentlyViewedArtworks: GraphQLFieldConfig<
  { recently_viewed_artwork_ids: string[] },
  ResolverContext
> = {
  type: artworkConnection.connectionType,
  args: pageable({}),
  description: "A list of the current user’s recently viewed artworks.",
  resolve: async (
    { recently_viewed_artwork_ids },
    args,
    { artworksLoader }
  ) => {
    const { page, size, offset } = convertConnectionArgsToGravityArgs(args)

    const pageArtworkIDs = recently_viewed_artwork_ids?.slice(
      offset,
      offset + size
    )

    const artworks = recently_viewed_artwork_ids?.length
      ? await artworksLoader({ ids: pageArtworkIDs })
      : []

    const totalCount = recently_viewed_artwork_ids.length

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
