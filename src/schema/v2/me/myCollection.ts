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
import { compact, isEqual, uniqWith } from "lodash"
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

type PriceInsight = {
  artistId: string
  demandRank: number
  medium: string
}

type MarketPriceInsightsType = Record<string, Record<string, PriceInsight>>

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

    try {
      const { body: artworks, headers } = await collectionArtworksLoader(
        "my-collection",
        gravityOptions
      )

      const submissionIds = compact([...artworks.map((c) => c.submission_id)])
      const submissions = await loadSubmissions(
        submissionIds,
        convectionGraphQLLoader
      )

      let artistIdMediumTuples = artworks.map((artwork: any) => ({
        artistId: artwork.artist?._id,
        medium: artwork.medium,
      }))

      // remove duplicates
      artistIdMediumTuples = uniqWith(artistIdMediumTuples, isEqual)

      const marketPriceInsights = await loadBatchPriceInsights(
        artistIdMediumTuples,
        vortexGraphqlLoader
      )

      enrichArtworksWithSubmissions(artworks, submissions)

      const artworksWithInsights = enrichArtworksWithPriceInsights(
        artworks,
        marketPriceInsights
      )
      const { page, size, offset } = convertConnectionArgsToGravityArgs(options)
      const totalCount = parseInt(headers["x-total-count"] || "0", 10)

      return paginationResolver({
        totalCount,
        offset,
        page,
        size,
        body: artworksWithInsights,
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

const enrichArtworksWithPriceInsights = (
  artworks: Array<any>,
  marketPriceInsights: MarketPriceInsightsType
) => {
  return artworks.map((artwork: any) => {
    const insights =
      marketPriceInsights[artwork.artist?._id]?.[artwork.medium] ?? null

    artwork.marketPriceInsights = insights
    return artwork
  })
}
