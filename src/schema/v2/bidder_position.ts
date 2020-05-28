import { get } from "lodash"
import date from "./fields/date"
import money, { amount } from "./fields/money"
import SaleArtwork from "./sale_artwork"
import { InternalIDFields } from "./object_identification"
import {
  GraphQLInt,
  GraphQLBoolean,
  GraphQLString,
  GraphQLObjectType,
  GraphQLFieldConfig,
} from "graphql"
import { ResolverContext } from "types/graphql"

const BidderPositionType = new GraphQLObjectType<any, ResolverContext>({
  name: "BidderPosition",
  fields: () => ({
    ...InternalIDFields,
    createdAt: date,
    updatedAt: date,
    processedAt: date,
    highestBid: {
      type: new GraphQLObjectType<any, ResolverContext>({
        name: "HighestBid",
        fields: {
          ...InternalIDFields,
          createdAt: date,
          number: {
            type: GraphQLInt,
          },
          isCancelled: {
            type: GraphQLBoolean,
            resolve: ({ cancelled }) => cancelled,
          },
          amount: amount(({ amount_cents }) => amount_cents),
          cents: {
            type: GraphQLInt,
            resolve: ({ amount_cents }) => amount_cents,
          },
          display: {
            type: GraphQLString,
            resolve: ({ display_amount_dollars }) => display_amount_dollars,
          },
        },
      }),
      resolve: ({ highest_bid }) => highest_bid,
    },
    isActive: {
      type: GraphQLBoolean,
      resolve: ({ active }) => active,
    },
    isRetracted: {
      type: GraphQLBoolean,
      resolve: ({ retracted }) => retracted,
    },
    isWithBidMax: {
      type: GraphQLBoolean,
      resolve: ({ bid_max }) => bid_max,
    },
    isWinning: {
      type: GraphQLBoolean,
      resolve: (position, _options, { saleArtworkRootLoader }) => {
        return saleArtworkRootLoader(position.sale_artwork_id).then(
          (saleArtwork) =>
            get(saleArtwork, "highest_bid.id") ===
            get(position, "highest_bid.id")
        )
      },
    },
    maxBid: money({
      name: "BidderPositionMaxBid",
      resolve: ({ display_max_bid_amount_dollars, max_bid_amount_cents }) => ({
        cents: max_bid_amount_cents,
        display: display_max_bid_amount_dollars,
      }),
    }),
    saleArtwork: {
      type: SaleArtwork.type,
      resolve: ({ sale_artwork_id }, _options, { saleArtworkRootLoader }) =>
        saleArtworkRootLoader(sale_artwork_id),
    },
    suggestedNextBid: money({
      name: "BidderPositionSuggestedNextBid",
      resolve: ({
        display_suggested_next_bid_dollars,
        suggested_next_bid_cents,
      }) => ({
        cents: suggested_next_bid_cents,
        display: display_suggested_next_bid_dollars,
      }),
    }),
  }),
})

const BidderPosition: GraphQLFieldConfig<void, ResolverContext> = {
  type: BidderPositionType,
  description: "An BidderPosition",
}

export default BidderPosition
