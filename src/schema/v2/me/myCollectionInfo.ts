import {
  GraphQLObjectType,
  GraphQLNonNull,
  GraphQLString,
  GraphQLBoolean,
  GraphQLFieldConfig,
  GraphQLInt,
} from "graphql"
import { convertConnectionArgsToGravityArgs } from "lib/helpers"
import { pageable } from "relay-cursor-paging"
import { artistConnection } from "schema/v2/artist"
import { ResolverContext } from "types/graphql"
import { paginationResolver } from "../fields/pagination"
import ArtistSorts from "../sorts/artist_sorts"

export const myCollectionInfoFields = {
  description: {
    type: new GraphQLNonNull(GraphQLString),
  },
  default: {
    type: new GraphQLNonNull(GraphQLBoolean),
  },
  includesPurchasedArtworks: {
    type: new GraphQLNonNull(GraphQLBoolean),
    resolve: (myCollection) => myCollection.includes_purchased_artworks,
  },
  name: {
    type: new GraphQLNonNull(GraphQLString),
  },
  private: {
    type: new GraphQLNonNull(GraphQLBoolean),
  },
  artworksCount: {
    type: new GraphQLNonNull(GraphQLInt),
    resolve: ({ artworks_count }) => artworks_count,
  },
  artistsCount: {
    type: new GraphQLNonNull(GraphQLInt),
    resolve: ({ artists_count }) => artists_count,
  },
  collectedArtistsConnection: {
    description: "A connection of artists in the users' collection",
    type: artistConnection.connectionType,
    args: pageable({
      sort: ArtistSorts,
      page: { type: GraphQLInt },
      size: { type: GraphQLInt },
    }),
    resolve: async (_root, args, context) => {
      const { collectionArtistsLoader } = context

      if (!collectionArtistsLoader) return

      const { page, offset, size, sort } = convertConnectionArgsToGravityArgs(
        args
      )

      const { body, headers } = await collectionArtistsLoader("my-collection", {
        size,
        page,
        sort,
        total_count: true,
      })
      const totalCount = parseInt(headers["x-total-count"] || "0", 10)

      return paginationResolver({ totalCount, offset, size, page, body, args })
    },
  },
}

const MyCollectionInfoType = new GraphQLObjectType<any, ResolverContext>({
  name: "MyCollectionInfo",
  fields: myCollectionInfoFields,
})

export const MyCollectionInfo: GraphQLFieldConfig<any, ResolverContext> = {
  type: MyCollectionInfoType,
  description: "Info about the current user's my-collection",
  resolve: async ({ id }, _options, { collectionLoader }) => {
    if (!collectionLoader) {
      return null
    }
    const collectionResponse = await collectionLoader("my-collection", {
      user_id: id,
      private: true,
    })

    return collectionResponse
  },
}
