import { pageable } from "relay-cursor-paging"
import { artworkConnection } from "../artwork"
import { GraphQLFieldConfig } from "graphql"
import { ResolverContext } from "types/graphql"
import { emptyConnection, paginationResolver } from "../fields/pagination"
import { map } from "lodash"
import { convertConnectionArgsToGravityArgs } from "lib/helpers"

const SAVED_ARTWORKS_SIZE = 3
const SIMILAR_ARTWORKS_SIZE = 10

export const BasedOnUserSaves: GraphQLFieldConfig<void, ResolverContext> = {
  description: "A connection of artwork recommendations, based on user saves",
  type: artworkConnection.connectionType,
  args: pageable({}),
  resolve: async (
    _parent,
    args,
    { savedArtworksLoader, xImpersonateUserID, userID, similarArtworksLoader },
    _info
  ) => {
    if (!savedArtworksLoader) return null

    const userId = userID || xImpersonateUserID

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
