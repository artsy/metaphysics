import {
  GraphQLObjectType,
  GraphQLNonNull,
  GraphQLString,
  GraphQLBoolean,
  GraphQLFieldConfig,
  GraphQLInt,
} from "graphql"
import { connectionFromArraySlice } from "graphql-relay"
import { convertConnectionArgsToGravityArgs } from "lib/helpers"
import { omit } from "lodash"
import { pageable } from "relay-cursor-paging"
import { artistConnection } from "schema/v2/artist"
import { ResolverContext } from "types/graphql"

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
    description: "A connection for the artists in the users' collection",
    type: artistConnection.connectionType,
    args: pageable({}),
    resolve: (_root, args, context) => {
      const { collectionArtistsLoader } = context

      if (!collectionArtistsLoader) return

      const gravityArgs = omit(convertConnectionArgsToGravityArgs(args), [
        "page",
      ])
      gravityArgs.total_count = true

      return collectionArtistsLoader("my-collection", gravityArgs).then(
        ({ body: collectedArtists, headers }) => {
          const totalCount = parseInt(headers["x-total-count"] || "0", 10)

          return {
            totalCount,
            ...connectionFromArraySlice(collectedArtists, args, {
              arrayLength: totalCount,
              sliceStart: gravityArgs.offset,
            }),
          }
        }
      )
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
