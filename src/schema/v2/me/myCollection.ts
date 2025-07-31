import {
  GraphQLBoolean,
  GraphQLEnumType,
  GraphQLFieldConfig,
  GraphQLInt,
  GraphQLList,
  GraphQLNonNull,
  GraphQLObjectType,
  GraphQLString,
  GraphQLUnionType,
} from "graphql"
import { connectionFromArray, cursorForObjectInConnection } from "graphql-relay"
import { enrichArtworksWithPriceInsights } from "lib/fillers/enrichArtworksWithPriceInsights"
import { GravityMutationErrorType } from "lib/gravityErrorHandler"
import { convertConnectionArgsToGravityArgs, snakeCaseKeys } from "lib/helpers"
import { reverse, sortBy, uniqWith } from "lodash"
import { pageable } from "relay-cursor-paging"
import { ResolverContext } from "types/graphql"
import { ArtworkType } from "../artwork"
import {
  connectionWithCursorInfo,
  paginationResolver,
} from "../fields/pagination"
import { myCollectionInfoFields } from "./myCollectionInfo"

const MAX_COLLECTION_SIZE = 100

const MyCollectionConnection = connectionWithCursorInfo({
  name: "MyCollection",
  nodeType: ArtworkType,
  connectionFields: myCollectionInfoFields,
})

export const {
  connectionType: MyCollectionConnectionType,
  edgeType: MyCollectionEdgeType,
} = MyCollectionConnection

export const MyCollection: GraphQLFieldConfig<any, ResolverContext> = {
  type: MyCollectionConnection.connectionType,
  args: pageable({
    page: { type: GraphQLInt },
    size: { type: GraphQLInt },
    includeOnlyTargetSupply: {
      type: GraphQLBoolean,
      defaultValue: false,
      description: "Show only artworks from target supply artists",
    },
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
    artistIDs: {
      type: new GraphQLList(new GraphQLNonNull(GraphQLString)),
      description: "Filter by artist IDs",
    },

    excludePurchasedArtworks: {
      type: GraphQLBoolean,
      defaultValue: false,
      description:
        "Exclude artworks that have been purchased on Artsy and automatically added to the collection.",
    },
    sortByLastAuctionResultDate: {
      type: GraphQLBoolean,
      defaultValue: false,
      description:
        "Sort by most recent price insight updates, filter out artworks without insights and return artworks uniq by artist & medium.",
    },
  }),
  resolve: async (
    _args,
    options,
    { meMyCollectionArtworksLoader, marketPriceInsightsBatchLoader }
  ) => {
    if (!meMyCollectionArtworksLoader || !marketPriceInsightsBatchLoader) {
      return null
    }

    // We're setting the size to 100 here because we're going to filter and sort these artworks later manualy.
    // The idea is to fetch (almost) all artworks and then filter/sort them in memory.
    const optionsAndPaginationArgs = options.sortByLastAuctionResultDate
      ? { size: MAX_COLLECTION_SIZE, ...options }
      : convertConnectionArgsToGravityArgs(options)

    const gravityOptions = {
      total_count: true,
      ...snakeCaseKeys(optionsAndPaginationArgs),
    }

    // This can't also be used with the offset in gravity
    // @ts-expect-error FIXME: Make `page` is an optional param of `gravityOptions`
    delete gravityOptions.page

    try {
      // Fetch artworks from Gravity

      const { body: artworks, headers } = await meMyCollectionArtworksLoader(
        gravityOptions
      )

      // Fetch market price insights for artworks

      let enrichedArtworks = await enrichArtworksWithPriceInsights(
        artworks,
        marketPriceInsightsBatchLoader
      )

      // sort by most recent price insight updates and filter out artworks without insights if requested

      if (options.sortByLastAuctionResultDate) {
        enrichedArtworks = enrichedArtworks.filter(
          (artwork) => artwork.marketPriceInsights
        )
        enrichedArtworks = reverse(
          sortBy(
            enrichedArtworks,
            (artwork) => artwork.marketPriceInsights?.lastAuctionResultDate
          )
        )
        enrichedArtworks = uniqWith(
          enrichedArtworks,
          (a, b) => a.artist._id === b.artist._id && a.category === b.category
        )
      }

      // Return connection

      const { page, size, offset } = convertConnectionArgsToGravityArgs(options)
      const totalCount = parseInt(headers["x-total-count"] || "0", 10)

      return paginationResolver({
        totalCount,
        offset,
        page,
        size,
        body: enrichedArtworks,
        args: options,
      })
    } catch (error) {
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
    }
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
