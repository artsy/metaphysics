import { isExisty } from "lib/helpers"
import { assign, compact, get } from "lodash"
import cached from "./fields/cached"
import date from "./fields/date"
import money, { amount } from "./fields/money"
import { formatMoney } from "accounting"
import numeral from "./fields/numeral"
import Artwork from "./artwork"
import Sale from "./sale"
import { GravityIDFields } from "./object_identification"
import {
  GraphQLFloat,
  GraphQLObjectType,
  GraphQLID,
  GraphQLString,
  GraphQLNonNull,
  GraphQLInt,
  GraphQLBoolean,
  GraphQLList,
} from "graphql"
import config from "config"

const { BIDDER_POSITION_MAX_BID_AMOUNT_CENTS_LIMIT } = config

export const isBiddable = (sale, { artwork: { sold } }) => {
  return !sold && sale.is_auction && sale.auction_state === "open"
}

const bid_increments_calculator = async ({
  sale_id,
  saleLoader,
  incrementsLoader,
  minimum_next_bid_cents,
}) => {
  const sale = await saleLoader(sale_id)
  if (!sale.increment_strategy) {
    return Promise.reject("schema/sale_artwork - Missing increment strategy")
  }

  const incrs = await incrementsLoader({
    key: sale.increment_strategy,
  })

  // We already have the asking price for the lot. Produce a list
  // of increments beyond that amount. Make a local copy of the
  // tiers to avoid mutating the cached value.
  const tiers = incrs[0].increments.slice()
  const increments = [minimum_next_bid_cents]
  const limit = BIDDER_POSITION_MAX_BID_AMOUNT_CENTS_LIMIT
  let current = 0 // Always start from zero, so that all prices are on-increment
  while (increments.length < 100 && current <= limit) {
    if (current > minimum_next_bid_cents) increments.push(current)
    const { to, amount: increase } = tiers[0]
    current += increase
    if (current > to && tiers.length > 1) tiers.shift()
  }
  return increments
}

// We're not using money() for this because it is a function, and we need a list.
const BidIncrementsFormatted = new GraphQLObjectType({
  name: "BidIncrementsFormatted",
  fields: {
    cents: {
      type: GraphQLFloat,
    },
    display: {
      type: GraphQLString,
    },
  },
})

const SaleArtworkType = new GraphQLObjectType({
  name: "SaleArtwork",
  fields: () => {
    return {
      ...GravityIDFields,
      cached,
      artwork: { type: Artwork.type, resolve: ({ artwork }) => artwork },
      bidder_positions_count: {
        type: GraphQLInt,
        deprecationReason: "Favor `counts.bidder_positions`",
      },
      bid_increments: {
        type: new GraphQLList(GraphQLFloat),
        deprecationReason: "Favor `increments.cents`",
        resolve: (
          { minimum_next_bid_cents, sale_id },
          options,
          request,
          { rootValue: { incrementsLoader, saleLoader } }
        ) => {
          return bid_increments_calculator({
            sale_id,
            saleLoader,
            incrementsLoader,
            minimum_next_bid_cents,
          })
        },
      },
      counts: {
        resolve: x => x,
        type: new GraphQLObjectType({
          name: "SaleArtworkCounts",
          fields: {
            bidder_positions: numeral(
              ({ bidder_positions_count }) => bidder_positions_count
            ),
          },
        }),
      },
      currency: {
        type: GraphQLString,
        description: `Currency abbreviation (e.g. "USD")`,
      },
      current_bid: money({
        name: "SaleArtworkCurrentBid",
        resolve: saleArtwork => ({
          ...GravityIDFields,
          cents:
            saleArtwork.highest_bid_amount_cents ||
            saleArtwork.opening_bid_cents,
          display:
            saleArtwork.display_highest_bid_amount_dollars ||
            saleArtwork.display_opening_bid_dollars,
        }),
      }),
      estimate: {
        type: GraphQLString,
        resolve: ({
          display_low_estimate_dollars,
          display_high_estimate_dollars,
          display_estimate_dollars,
        }) => {
          return (
            compact([
              display_low_estimate_dollars,
              display_high_estimate_dollars,
            ]).join("–") || display_estimate_dollars
          )
        },
      },
      estimate_cents: {
        type: GraphQLInt,
        description: "Singular estimate field, if specified",
      },
      high_estimate: money({
        name: "SaleArtworkHighEstimate",
        resolve: ({ display_high_estimate_dollars, high_estimate_cents }) => ({
          cents: high_estimate_cents,
          display: display_high_estimate_dollars,
        }),
      }),
      high_estimate_cents: {
        type: GraphQLFloat,
        deprecationReason: "Favor `high_estimate",
      },
      highest_bid: {
        type: new GraphQLObjectType({
          name: "SaleArtworkHighestBid",
          fields: {
            id: {
              type: GraphQLID,
            },
            created_at: date,
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
              type: GraphQLFloat,
              deprecationReason: "Favor `cents`",
            },
          },
        }),
        resolve: ({ symbol, highest_bid }) => assign({ symbol }, highest_bid),
      },
      increments: {
        type: new GraphQLList(BidIncrementsFormatted),
        args: {
          useMyMaxBid: {
            type: GraphQLBoolean,
            description:
              "Whether or not to start the increments at the user's latest bid",
          },
        },
        resolve: async (
          { _id, minimum_next_bid_cents, sale_id, symbol },
          { useMyMaxBid },
          request,
          { rootValue: { incrementsLoader, lotStandingLoader, saleLoader } }
        ) => {
          let minimumNextBid
          minimumNextBid = minimum_next_bid_cents

          let isLeading
          isLeading = false

          if (useMyMaxBid && lotStandingLoader) {
            const myLotStandings = await lotStandingLoader({
              sale_artwork_id: _id,
            })

            const myCurrentMax = get(
              myLotStandings,
              "0.max_position.max_bid_amount_cents"
            )

            isLeading = isExisty(get(myLotStandings, "0.leading_position"))
            minimumNextBid = isLeading ? myCurrentMax : minimum_next_bid_cents
          }

          return bid_increments_calculator({
            sale_id,
            saleLoader,
            incrementsLoader,
            minimum_next_bid_cents: minimumNextBid,
          }).then(bid_increments => {
            // If you are leading, we want to show increments _above_ your max
            // bid (which is the first element of the array). If you are not
            // leading, the first element of the array represents the next
            // amount you could bid.
            if (isLeading) {
              bid_increments.shift()
            }

            return bid_increments.map(increment => {
              return {
                cents: increment,
                display: formatMoney(increment / 100, { symbol, precision: 0 }),
              }
            })
          })
        },
      },
      is_bid_on: {
        type: GraphQLBoolean,
        resolve: ({ bidder_positions_count }) => bidder_positions_count !== 0,
      },
      is_biddable: {
        type: GraphQLBoolean,
        description: "Can bids be placed on the artwork?",
        resolve: (
          saleArtwork,
          options,
          request,
          { rootValue: { saleLoader } }
        ) => {
          if (!!saleArtwork.sale) {
            return isBiddable(saleArtwork.sale, saleArtwork)
          }
          return saleLoader(saleArtwork.sale_id).then(sale =>
            isBiddable(sale, saleArtwork)
          )
        },
      },
      is_with_reserve: {
        type: GraphQLBoolean,
        resolve: ({ reserve_status }) => reserve_status !== "no_reserve",
      },
      lot_label: { type: GraphQLString },
      lot_number: {
        type: GraphQLString,
        deprecationReason: "Favor `lot_label`",
      },
      low_estimate: money({
        name: "SaleArtworkLowEstimate",
        resolve: ({ display_low_estimate_dollars, low_estimate_cents }) => ({
          cents: low_estimate_cents,
          display: display_low_estimate_dollars,
        }),
      }),
      low_estimate_cents: {
        type: GraphQLFloat,
        deprecationReason: "Favor `low_estimate`",
      },
      minimum_next_bid: money({
        name: "SaleArtworkMinimumNextBid",
        resolve: ({
          display_minimum_next_bid_dollars,
          minimum_next_bid_cents,
        }) => ({
          cents: minimum_next_bid_cents,
          display: display_minimum_next_bid_dollars,
        }),
      }),
      minimum_next_bid_cents: {
        type: GraphQLFloat,
        deprecationReason: "Favor `minimum_next_bid`",
      },
      opening_bid: money({
        name: "SaleArtworkOpeningBid",
        resolve: ({ display_opening_bid_dollars, opening_bid_cents }) => ({
          cents: opening_bid_cents,
          display: display_opening_bid_dollars,
        }),
      }),
      opening_bid_cents: {
        type: GraphQLFloat,
        deprecationReason: "Favor `opening_bid`",
      },
      position: { type: GraphQLInt },
      reserve: money({
        name: "SaleArtworkReserve",
        resolve: ({ display_reserve_dollars, reserve_cents }) => ({
          cents: reserve_cents,
          display: display_reserve_dollars,
        }),
      }),
      reserve_message: {
        type: GraphQLString,
        resolve: ({ bidder_positions_count, reserve_status }) => {
          if (reserve_status === "reserve_met") {
            return "Reserve met"
          } else if (
            bidder_positions_count === 0 &&
            reserve_status === "reserve_not_met"
          ) {
            return "This work has a reserve"
          } else if (
            bidder_positions_count > 0 &&
            reserve_status === "reserve_not_met"
          ) {
            return "Reserve not met"
          }
          return null
        },
      },
      reserve_status: { type: GraphQLString },
      sale_id: { type: GraphQLString },
      sale: {
        type: Sale.type,
        resolve: (
          { sale, sale_id },
          options,
          request,
          { rootValue: { saleLoader } }
        ) => {
          if (!!sale) return sale
          return saleLoader(sale_id)
        },
      },
      symbol: {
        type: GraphQLString,
        description: `Currency symbol (e.g. "$")`,
      },
    }
  },
})

const SaleArtwork = {
  type: SaleArtworkType,
  description: "A Sale Artwork",
  args: {
    id: {
      type: new GraphQLNonNull(GraphQLString),
      description: "The slug or ID of the SaleArtwork",
    },
  },
  resolve: async (
    root,
    { id },
    request,
    { rootValue: { saleArtworkRootLoader } }
  ) => {
    const data = await saleArtworkRootLoader(id)
    return data
  },
}

export default SaleArtwork
