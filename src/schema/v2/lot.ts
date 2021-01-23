import { GraphQLError, GraphQLObjectType } from "graphql"
import { SaleArtworkType } from "schema/v2/sale_artwork"
import { Response as FetchResponse } from "node-fetch"
import { ResolverContext } from "types/graphql"
import {
  NodeInterface,
  SlugAndInternalIDFields,
} from "schema/v2/object_identification"
import { reduce } from "lodash"
import { pageable } from "relay-cursor-paging"
import { connectionWithCursorInfo } from "./fields/pagination"
import gql from "lib/gql"
import { convertConnectionArgsToGravityArgs } from "lib/helpers"
import { connectionFromArray } from "graphql-relay"

export const LotType = new GraphQLObjectType<any, ResolverContext>({
  name: "Lot",
  interfaces: () => {
    return [NodeInterface]
  },
  fields: () => {
    return {
      // Must place an `id` at the root of the object (next to saleArtwork)
      // when resolving a lot
      ...SlugAndInternalIDFields,
      saleArtwork: {
        type: SaleArtworkType,
        description: "The saleArtwork object.",
        resolve: ({ saleArtwork }) => {
          return saleArtwork
        },
      },
    }
  },
})

export const auctionLotConnection = connectionWithCursorInfo({
  nodeType: LotType,
})

export const watchedLotConnection = {
  description: "A list of lots a user is watching",
  type: auctionLotConnection.connectionType,
  args: pageable(),
  resolve: async (_parent, args, context) => {
    const { saleArtworksAllLoader, causalityLoader } = context
    // fetch sale artworks from gravity
    const { first = 25, ...rest } = args

    const connectionOptions = {
      include_watched_artworks: true,
      total_count: true,
      first,
      ...rest,
    }
    const params = convertConnectionArgsToGravityArgs(connectionOptions)
    delete params.page

    const { body, headers } = await saleArtworksAllLoader(params)
    const watchedSaleArtworks: any[] = body
    const totalCount = parseInt(headers["x-total-count"] || "0", 10)
    const saleArtworkIds = watchedSaleArtworks.map((sa) => sa._id)

    const lotStatesResponse = await causalityLoader({
      query: gql`
        query WatchedLotsQuery($ids: [ID!]!) {
          lots(ids: $ids) {
            id
            internalID
            saleId
            bidCount
            reserveStatus
            sellingPriceCents
            onlineAskingPriceCents
            floorSellingPriceCents
            onlineSellingToBidder {
              __typename
              ... on ArtsyBidder {
                id
                paddleNumber
                userId
              }
            }
            floorWinningBidder {
              __typename
              ... on ArtsyBidder {
                id
                paddleNumber
                userId
              }
            }
            soldStatus
          }
        }
      `,
      variables: {
        ids: saleArtworkIds,
      },
    }).then((res: FetchResponse) => res.json())

    const { data: causalityData, errors: causalityErrors } = lotStatesResponse

    // If the causality request failed for some reason, throw its errors.
    if (causalityErrors) {
      const errors = causalityErrors.reduce((acc, ce) => {
        return acc + " " + ce["message"]
      }, "From causality: ")
      throw new GraphQLError(errors)
    } else {
      // make a map of lot state data
      const lotDataMap = causalityData.lots.reduce((acc, lot) => {
        acc[lot.internalID] = lot
        return acc
      }, {})

      // place lotData in context for retrieval at stitching stage
      context.lotDataMap = lotDataMap

      // create nodes from sale artworks
      const availableLotDataIds = Object.keys(lotDataMap)
      const nodes = watchedSaleArtworks.reduce((acc, saleArtwork) => {
        if (!availableLotDataIds.find((id) => id === saleArtwork._id)) {
          console.warn(`lot state for ${saleArtwork._id} not found - skipping`)
          return acc
        } else {
          return [
            ...acc,
            { _id: saleArtwork._id, id: saleArtwork.id, saleArtwork },
          ]
        }
      }, [])

      return {
        totalCount,
        ...connectionFromArray(nodes, connectionOptions),
      }
    }
  },
}
