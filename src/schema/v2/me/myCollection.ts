import {
  GraphQLBoolean,
  GraphQLEnumType,
  GraphQLFieldConfig,
  GraphQLNonNull,
  GraphQLObjectType,
  GraphQLString,
  GraphQLUnionType,
} from "graphql"
import {
  connectionFromArray,
  connectionFromArraySlice,
  cursorForObjectInConnection,
} from "graphql-relay"
import { GravityMutationErrorType } from "lib/gravityErrorHandler"
import { convertConnectionArgsToGravityArgs } from "lib/helpers"
import { pageable } from "relay-cursor-paging"
import { ResolverContext } from "types/graphql"
import { ArtworkType } from "../artwork"
import { connectionWithCursorInfo } from "../fields/pagination"

const myCollectionFields = {
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
}

// MyCollectionInfo
const MyCollectionInfoType = new GraphQLObjectType<any, ResolverContext>({
  name: "MyCollectionInfo",
  fields: () => myCollectionFields,
})

export const MyCollectionInfo: GraphQLFieldConfig<any, ResolverContext> = {
  type: MyCollectionInfoType,
  description: "Info about the current user's my-collection",
  resolve: ({ id }, _options, { collectionLoader }) => {
    if (!collectionLoader) {
      return null
    }
    return collectionLoader("my-collection", {
      user_id: id,
      private: true,
    }).then((myCollectionInfo) => {
      return myCollectionInfo
    })
  },
}

// ConnectionArtworks
const MyCollectionConnection = connectionWithCursorInfo({
  name: "MyCollection",
  nodeType: ArtworkType,
  connectionFields: myCollectionFields,
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
    excludePurchasedArtworks: {
      type: GraphQLBoolean,
      defaultValue: false,
      description:
        "Exclude artworks that have been purchased on Artsy and automatically added to the collection.",
    },
  }),
  resolve: async (
    { id: userId },
    options,
    { collectionArtworksLoader, submissionsLoader }
  ) => {
    if (!collectionArtworksLoader || !submissionsLoader) {
      return null
    }

    const gravityOptions = Object.assign(
      {
        exclude_purchased_artworks: options.excludePurchasedArtworks,
        private: true,
        total_count: true,
        user_id: userId,
      },
      convertConnectionArgsToGravityArgs(options)
    )

    // This can't also be used with the offset in gravity
    // @ts-expect-error FIXME: Make `page` is an optional param of `gravityOptions`
    delete gravityOptions.page

    return Promise.all([
      collectionArtworksLoader("my-collection", gravityOptions),
      submissionsLoader(),
    ])
      .then(([{ body: artworks, headers }, submissions]) => {
        const artworksWithSubmissions = enrichArtworks(artworks, submissions)

        return connectionFromArraySlice(artworksWithSubmissions, options, {
          arrayLength: parseInt(headers["x-total-count"] || "0", 10),
          sliceStart: gravityOptions.offset,
        })
      })
      .catch((error) => {
        console.error("[schema/v2/me/my_collection] Error:", error)

        if (error.message == "Collection Not Found") {
          // For some users with no items, Gravity produces an error of
          // "Collection Not Found". This can cause the Gravity endpoint to
          // produce a 404, so we will intercept the error and return an empty
          // list instead.
          return connectionFromArray([], options)
        } else {
          throw error
        }
      })
  },
}

/** Enriches artworks with submissions (filters out draft submissions). */
const enrichArtworks = (artworks: any[], submissions: any[]) => {
  if (submissions.length === 0) {
    return artworks
  }

  const filteredSubmissions = submissions.filter(
    (submission) => submission.state !== "draft"
  )

  return artworks.map((artwork) => {
    const consignmentSubmission = filteredSubmissions.find((submission) => {
      return submission.my_collection_artwork_id === artwork.id
    })

    return { ...artwork, consignmentSubmission }
  })
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
