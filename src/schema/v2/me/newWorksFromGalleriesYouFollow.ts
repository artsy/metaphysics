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

    const { body: artworks, headers } = await followedProfilesArtworksLoader({
      size,
      offset,
    })

    const totalCount = parseInt(headers["x-total-count"] || "0", 10)

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
