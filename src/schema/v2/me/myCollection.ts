import {
  GraphQLBoolean,
  GraphQLEnumType,
  GraphQLFieldConfig,
  GraphQLInt,
  GraphQLObjectType,
  GraphQLUnionType,
} from "graphql"
import { connectionFromArray, cursorForObjectInConnection } from "graphql-relay"
import { GravityMutationErrorType } from "lib/gravityErrorHandler"
import { convertConnectionArgsToGravityArgs } from "lib/helpers"
import { compact, isEqual, reverse, sortBy, uniqWith } from "lodash"
import { pageable } from "relay-cursor-paging"
import { ResolverContext } from "types/graphql"
import { ArtworkType } from "../artwork"
import {
  connectionWithCursorInfo,
  paginationResolver,
} from "../fields/pagination"
import { loadBatchPriceInsights } from "lib/loadBatchPriceInsights"
import { loadSubmissions } from "./loadSubmissions"
import { myCollectionInfoFields } from "./myCollectionInfo"
import { StaticPathLoader } from "lib/loaders/api/loader_interface"

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
    sortByLastAuctionResultDate: {
      type: GraphQLBoolean,
      defaultValue: false,
      description:
        "Sort by most recent price insight updates, filter out artworks without insights and return artworks uniq by artist & medium.",
    },
  }),
  resolve: async (
    { id: userId },
    options,
    { collectionArtworksLoader, convectionGraphQLLoader, vortexGraphqlLoader }
  ) => {
    if (
      !collectionArtworksLoader ||
      !convectionGraphQLLoader ||
      !vortexGraphqlLoader
    ) {
      return null
    }

    const paginationArgs = options.sortByLastAuctionResultDate
      ? { size: 100 }
      : convertConnectionArgsToGravityArgs(options)

    const gravityOptions = {
      exclude_purchased_artworks: options.excludePurchasedArtworks,
      private: true,
      total_count: true,
      user_id: userId,
      ...paginationArgs,
    }

    // This can't also be used with the offset in gravity
    // @ts-expect-error FIXME: Make `page` is an optional param of `gravityOptions`
    delete gravityOptions.page

    try {
      // Fetch artworks from Gravity

      const { body: artworks, headers } = await collectionArtworksLoader(
        "my-collection",
        gravityOptions
      )

      // Fetch submission statues for artworks

      const submissionIds = compact([...artworks.map((c) => c.submission_id)])
      const submissions = await loadSubmissions(
        submissionIds,
        convectionGraphQLLoader
      )

      enrichArtworksWithSubmissions(artworks, submissions)

      // Fetch market price insights for artworks

      let enrichedArtworks = await enrichArtworksWithPriceInsights(
        artworks,
        vortexGraphqlLoader
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
          (a, b) => a.artist._id === b.artist._id && a.medium === b.medium
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

const enrichArtworksWithSubmissions = async (
  artworks: Array<any>,
  submissions?: Array<any>
) => {
  if (submissions?.length) {
    submissions.forEach((submission: any) => {
      const artwork = artworks.find(
        (artwork) => artwork.submission_id == submission.id
      )

      if (artwork) {
        artwork.consignmentSubmission = submission
      }
    })
  }
}

const enrichArtworksWithPriceInsights = async (
  artworks: Array<any>,
  vortexGraphqlLoader: ({ query, variables }) => StaticPathLoader<any>
) => {
  const artistIdMediumTuples = uniqWith(
    artworks.map((artwork: any) => ({
      artistId: artwork.artist?._id,
      medium: artwork.medium,
    })),
    isEqual
  )

  const marketPriceInsights = await loadBatchPriceInsights(
    artistIdMediumTuples,
    vortexGraphqlLoader
  )

  return artworks.map((artwork: any) => {
    const insights =
      marketPriceInsights[artwork.artist?._id]?.[artwork.medium] ?? null

    artwork.marketPriceInsights = insights
    return artwork
  })
}
