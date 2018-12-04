import { get } from "lodash"
import date from "./fields/date"
import money, { amount } from "./fields/money"
import SaleArtwork from "./sale_artwork"
import { IDFields } from "./object_identification"
import {
  GraphQLInt,
  GraphQLBoolean,
  GraphQLString,
  GraphQLObjectType,
} from "graphql"

const BidderPositionType = new GraphQLObjectType({
  name: "BidderPosition",
  fields: () => ({
    ...IDFields,
    created_at: date,
    updated_at: date,
    processed_at: date,
    display_max_bid_amount_dollars: {
      type: GraphQLString,
      deprecationReason: "Favor `max_bid`",
    },
    display_suggested_next_bid_dollars: {
      type: GraphQLString,
      deprecationReason: "Favor `suggested_next_bid`",
    },
    highest_bid: {
      type: new GraphQLObjectType({
        name: "HighestBid",
        fields: {
          ...IDFields,
          created_at: date,
          number: {
            type: GraphQLInt,
          },
          is_cancelled: {
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
          amount_cents: {
            type: GraphQLInt,
            deprecationReason: "Favor `cents`",
          },
          display_amount_dollars: {
            type: GraphQLString,
            deprecationReason: "Favor `display`",
          },
        },
      }),
    },
    is_active: {
      type: GraphQLBoolean,
      resolve: ({ active }) => active,
    },
    is_retracted: {
      type: GraphQLBoolean,
      resolve: ({ retracted }) => retracted,
    },
    is_with_bid_max: {
      type: GraphQLBoolean,
      resolve: ({ bid_max }) => bid_max,
    },
    is_winning: {
      type: GraphQLBoolean,
      resolve: (
        position,
        options,
        request,
        { rootValue: { saleArtworkRootLoader } }
      ) => {
        return saleArtworkRootLoader(position.sale_artwork_id).then(
          saleArtwork =>
            get(saleArtwork, "highest_bid.id") ===
            get(position, "highest_bid.id")
        )
      },
    },
    max_bid: money({
      name: "BidderPositionMaxBid",
      resolve: ({ display_max_bid_amount_dollars, max_bid_amount_cents }) => ({
        cents: max_bid_amount_cents,
        display: display_max_bid_amount_dollars,
      }),
    }),
    max_bid_amount_cents: {
      type: GraphQLInt,
      deprecationReason: "Favor `max_bid`",
    },
    sale_artwork: {
      type: SaleArtwork.type,
      resolve: (
        { sale_artwork_id },
        options,
        request,
        { rootValue: { saleArtworkRootLoader } }
      ) => saleArtworkRootLoader(sale_artwork_id),
    },
    suggested_next_bid: money({
      name: "BidderPositionSuggestedNextBid",
      resolve: ({
        display_suggested_next_bid_dollars,
        suggested_next_bid_cents,
      }) => ({
        cents: suggested_next_bid_cents,
        display: display_suggested_next_bid_dollars,
      }),
    }),
    suggested_next_bid_cents: {
      type: GraphQLInt,
      deprecationReason: "Favor `suggested_next_bid`",
    },
  }),
})

const BidderPosition = {
  type: BidderPositionType,
  description: "An BidderPosition",
}

export default BidderPosition
