import { GraphQLFieldConfig } from "graphql"
import { connectionFromArraySlice } from "graphql-relay"
import { convertConnectionArgsToGravityArgs } from "lib/helpers"
import { pageable } from "relay-cursor-paging"
import { artworkConnection } from "schema/v2/artwork"
import { ResolverContext } from "types/graphql"
import { createPageCursors } from "../fields/pagination"

export const newWorksFromGalleriesYouFollow: GraphQLFieldConfig<
  {},
  ResolverContext
> = {
  type: artworkConnection.connectionType,
  args: pageable({}),
  description: "A list of artworks from galleries the user follows.",
  resolve: async ({}, args, { followedProfilesArtworksLoader }) => {
    if (!followedProfilesArtworksLoader) return null

    const { page, size, offset } = convertConnectionArgsToGravityArgs(args)

    const { body: artworks } = await followedProfilesArtworksLoader({
      size,
      offset,
      for_sale: true,
    })

    const totalCount = calculateTotalCount(artworks, size, offset)

    const connection = connectionFromArraySlice(artworks, args, {
      arrayLength: totalCount,
      sliceStart: offset,
    })

    const totalPages = Math.ceil(totalCount / size)

    return {
      totalCount,
      pageCursors: createPageCursors({ ...args, page, size }, totalCount),
      ...connection,
      pageInfo: {
        ...connection.pageInfo,
        hasPreviousPage: page > 1,
        hasNextPage: page < totalPages,
      },
    }
  },
}

// Because the loader doesn't return the total size, we use this way to calculate it for the connection.
// If the number of artworks is equal to the size, then there is a next page.
const calculateTotalCount = (artworks: any[], size: number, offset: number) => {
  const hasNextPage = artworks.length === size
  const currentCount = offset + artworks.length

  return hasNextPage ? currentCount + 1 : currentCount
}
