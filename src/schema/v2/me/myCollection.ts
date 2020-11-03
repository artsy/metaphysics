import { ResolverContext } from "types/graphql"
import { pageable } from "relay-cursor-paging"
import { convertConnectionArgsToGravityArgs } from "lib/helpers"
import {
  connectionFromArraySlice,
  connectionFromArray,
  cursorForObjectInConnection,
} from "graphql-relay"

import { connectionWithCursorInfo } from "../fields/pagination"
import { ArtworkType } from "../artwork"

import {
  GraphQLFieldConfig,
  GraphQLNonNull,
  GraphQLString,
  GraphQLBoolean,
  GraphQLObjectType,
  GraphQLUnionType,
  GraphQLEnumType,
} from "graphql"
import { GravityMutationErrorType } from "lib/gravityErrorHandler"

const MyCollectionConnection = connectionWithCursorInfo({
  name: "MyCollection",
  nodeType: ArtworkType,
  connectionFields: {
    description: {
      type: new GraphQLNonNull(GraphQLString),
    },
    default: {
      type: new GraphQLNonNull(GraphQLBoolean),
    },
    name: {
      type: new GraphQLNonNull(GraphQLString),
    },
    private: {
      type: new GraphQLNonNull(GraphQLBoolean),
    },
  },
})

export const {
  connectionType: MyCollectionConnectionType,
  edgeType: MyCollectionEdgeType,
} = MyCollectionConnection

export const MyCollection: GraphQLFieldConfig<any, ResolverContext> = {
  type: MyCollectionConnection.connectionType,
  args: pageable({
    sort: {
      type: new GraphQLEnumType({
        name: "MyCollectionArtworkSorts",
        values: {
          CREATED_AT_ASC: {
            value: "created_at",
          },
          CREATED_AT_DESC: {
            value: "-created_at",
          },
          POSITION_ASC: {
            value: "position",
          },
          POSITION_DESC: {
            value: "-position",
          },
        },
      }),
    },
  }),
  resolve: ({ id: userId }, options, { collectionArtworksLoader }) => {
    if (!collectionArtworksLoader) {
      return null
    }
    const gravityOptions = Object.assign(
      { private: true, total_count: true, user_id: userId },
      convertConnectionArgsToGravityArgs(options)
    )

    // This can't also be used with the offset in gravity
    delete gravityOptions.page

    return collectionArtworksLoader("my-collection", gravityOptions)
      .then(({ body, headers }) => {
        return connectionFromArraySlice(body, options, {
          arrayLength: parseInt(headers["x-total-count"] || "0", 10),
          sliceStart: gravityOptions.offset,
        })
      })
      .catch((error) => {
        console.error("[schema/v2/me/my_collection] Error:", error)

        // For some users with no items, Gravity produces an error of
        // "Collection Not Found". This can cause the Gravity endpoint to
        // produce a 404, so we will intercept the error and return an empty
        // list instead.
        return connectionFromArray([], options)
      })
  },
}

/**
 * Mutations
 */

const MyCollectionArtworkMutationSuccessType = new GraphQLObjectType<
  any,
  ResolverContext
>({
  name: "MyCollectionArtworkMutationSuccess",
  isTypeOf: (data) => data.id,
  fields: () => ({
    artwork: {
      type: ArtworkType,
      resolve: ({ id }, _, { artworkLoader }) => {
        if (artworkLoader) {
          return artworkLoader(id)
        }
      },
    },
    artworkEdge: {
      type: MyCollectionEdgeType,
      resolve: async ({ id }, _, { artworkLoader }) => {
        if (!artworkLoader) {
          return null
        }
        const artwork = await artworkLoader(id)
        const edge = {
          cursor: cursorForObjectInConnection([artwork], artwork),
          node: artwork,
        }
        return edge
      },
    },
  }),
})

const MyCollectionArtworkMutationDeleteSuccess = new GraphQLObjectType<
  any,
  ResolverContext
>({
  name: "MyCollectionArtworkMutationDeleteSuccess",
  isTypeOf: (data) => {
    return data.deleted
  },
  fields: () => ({
    success: {
      type: GraphQLBoolean,
      resolve: () => true,
    },
  }),
})

const MyCollectionArtworkMutationFailureType = new GraphQLObjectType<
  any,
  ResolverContext
>({
  name: "MyCollectionArtworkMutationFailure",
  isTypeOf: (data) => {
    return data._type === "GravityMutationError"
  },
  fields: () => ({
    mutationError: {
      type: GravityMutationErrorType,
      resolve: (err) => err,
    },
  }),
})

export const MyCollectionArtworkMutationType = new GraphQLUnionType({
  name: "MyCollectionArtworkMutationType",
  types: [
    MyCollectionArtworkMutationSuccessType,
    MyCollectionArtworkMutationDeleteSuccess,
    MyCollectionArtworkMutationFailureType,
  ],
})
