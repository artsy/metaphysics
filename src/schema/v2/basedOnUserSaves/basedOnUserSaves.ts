import { pageable } from "relay-cursor-paging"
import { artworkConnection } from "../artwork"
import { GraphQLFieldConfig, GraphQLString } from "graphql"
import { ResolverContext } from "types/graphql"
import { emptyConnection, paginationResolver } from "../fields/pagination"
import { map } from "lodash"
import { convertConnectionArgsToGravityArgs } from "lib/helpers"

const SAVED_ARTWORKS_SIZE = 3
const SIMILAR_ARTWORKS_SIZE = 10

export const BasedOnUserSaves: GraphQLFieldConfig<void, ResolverContext> = {
  description: "A connection of artwork recommendations, based on user saves",
  type: artworkConnection.connectionType,
  args: pageable({
    userId: { type: GraphQLString },
  }),
  resolve: async (
    _parent,
    args,
    { savedArtworksLoader, userID, similarArtworksLoader },
    _info
  ) => {
    const userId = userID || args.userId
    if (!userId) return null

    const gravityArgs = convertConnectionArgsToGravityArgs(args)
    const { page, size, offset } = gravityArgs

    const { body: works } = await savedArtworksLoader({
      size: SAVED_ARTWORKS_SIZE,
      sort: "-position",
      user_id: userId,
      private: true,
    })

    if (works.length === 0) return emptyConnection

    const artworks = await similarArtworksLoader({
      artwork_id: map(works, "_id"),
      for_sale: true,
      size: size || SIMILAR_ARTWORKS_SIZE,
      offset,
      total_count: true,
    })

    return paginationResolver({
      totalCount: artworks.length,
      offset,
      page,
      size,
      body: artworks,
      args,
    })
  },
}
