import { isExisty } from "lib/helpers"
import { assign, compact, get } from "lodash"
import cached from "./fields/cached"
import { date } from "./fields/date"
import money, { amount } from "./fields/money"
import { formatMoney } from "accounting"
import numeral from "./fields/numeral"
import Artwork from "./artwork"
import Sale from "./sale"
import { CalculatedCost } from "./types/calculated_cost"
import {
  GravityIDFields,
  SlugAndInternalIDFields,
} from "./object_identification"
import {
  GraphQLFloat,
  GraphQLObjectType,
  GraphQLString,
  GraphQLNonNull,
  GraphQLInt,
  GraphQLBoolean,
  GraphQLList,
  GraphQLFieldConfig,
} from "graphql"
import config from "config"
import { ResolverContext } from "types/graphql"
import { LoadersWithoutAuthentication } from "lib/loaders/loaders_without_authentication"
import { NodeInterface } from "schema/v2/object_identification"
import { CausalityLotState } from "./lot"
import { formattedEndDateTime, formattedStartDateTime } from "lib/date"

const { BIDDER_POSITION_MAX_BID_AMOUNT_CENTS_LIMIT } = config

export const isBiddable = (sale, { artwork: { sold } }) => {
  return !sold && sale.is_auction && sale.auction_state === "open"
}

const bid_increments_calculator = async ({
  sale_id,
  saleLoader,
  incrementsLoader,
  minimum_next_bid_cents,
}: {
  sale_id: string
  saleLoader: LoadersWithoutAuthentication["saleLoader"]
  incrementsLoader: LoadersWithoutAuthentication["incrementsLoader"]
  minimum_next_bid_cents: number
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
const BidIncrementsFormatted = new GraphQLObjectType<any, ResolverContext>({
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

export const SaleArtworkType = new GraphQLObjectType<any, ResolverContext>({
  name: "SaleArtwork",
  interfaces: () => {
    const { ArtworkEdgeInterface } = require("./artwork")
    return [NodeInterface, ArtworkEdgeInterface]
  },
  fields: () => {
    return {
      ...SlugAndInternalIDFields,
      cached,
      artwork: { type: Artwork.type, resolve: ({ artwork }) => artwork },
      node: { type: Artwork.type, resolve: ({ artwork }) => artwork },
      cursor: { type: GraphQLString },
      counts: {
        resolve: (x) => x,
        type: new GraphQLObjectType<any, ResolverContext>({
          name: "SaleArtworkCounts",
          fields: {
            bidderPositions: numeral(
              ({ bidder_positions_count }) => bidder_positions_count
            ),
          },
        }),
      },
      currency: {
        type: GraphQLString,
        description: `Currency abbreviation (e.g. "USD")`,
      },
      currentBid: money({
        name: "SaleArtworkCurrentBid",
        resolve: (saleArtwork) => ({
          ...GravityIDFields,
          cents:
            saleArtwork.highest_bid_amount_cents ||
            saleArtwork.opening_bid_cents,
          display:
            saleArtwork.display_highest_bid_amount_dollars ||
            saleArtwork.display_opening_bid_dollars,
        }),
      }),
      endAt: date(({ end_at }) => end_at),
      endedAt: date(({ ended_at }) => ended_at),
      extendedBiddingEndAt: date(
        ({ extended_bidding_end_at }) => extended_bidding_end_at
      ),
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
      estimateCents: {
        type: GraphQLInt,
        description: "Singular estimate field, if specified",
        resolve: ({ estimate_cents }) => estimate_cents,
      },
      formattedStartDateTime: {
        type: GraphQLString,
        description:
          "A formatted description of when the lot starts or ends or if it has ended",
        resolve: (saleArtwork, _options, { defaultTimezone, saleLoader }) =>
          saleLoader(saleArtwork.sale_id).then((sale) => {
            if (!sale.cascading_end_time_interval_minutes) {
              return null
            } else {
              return formattedStartDateTime(
                sale.start_at,
                saleArtwork.ended_at ||
                  saleArtwork.extended_bidding_end_at ||
                  saleArtwork.end_at,
                null,
                defaultTimezone
              )
            }
          }),
      },
      formattedEndDateTime: {
        type: GraphQLString,
        description: "A formatted description of the lot end date and time",
        resolve: (saleArtwork, _options, { defaultTimezone, saleLoader }) =>
          saleLoader(saleArtwork.sale_id).then((sale) => {
            if (
              !sale.cascading_end_time_interval_minutes ||
              saleArtwork.ended_at ||
              !saleArtwork.end_at
            ) {
              return null
            } else {
              return formattedEndDateTime(saleArtwork.end_at, defaultTimezone)
            }
          }),
      },
      highEstimate: money({
        name: "SaleArtworkHighEstimate",
        resolve: ({ display_high_estimate_dollars, high_estimate_cents }) => ({
          cents: high_estimate_cents,
          display: display_high_estimate_dollars,
        }),
      }),
      highestBid: {
        type: new GraphQLObjectType<any, ResolverContext>({
          name: "SaleArtworkHighestBid",
          fields: {
            createdAt: date(),
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
          { incrementsLoader, lotStandingLoader, saleLoader }
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
          }).then((bid_increments) => {
            // If you are leading, we want to show increments _above_ your max
            // bid (which is the first element of the array). If you are not
            // leading, the first element of the array represents the next
            // amount you could bid.
            if (isLeading) {
              bid_increments.shift()
            }

            return bid_increments.map((increment) => {
              return {
                cents: increment,
                display: formatMoney(increment / 100, { symbol, precision: 0 }),
              }
            })
          })
        },
      },
      isBidOn: {
        type: GraphQLBoolean,
        resolve: ({ bidder_positions_count }) => bidder_positions_count !== 0,
      },
      isBiddable: {
        type: GraphQLBoolean,
        description: "Can bids be placed on the artwork?",
        resolve: (saleArtwork, _options, { saleLoader }) => {
          if (!!saleArtwork.sale) {
            return isBiddable(saleArtwork.sale, saleArtwork)
          }
          return saleLoader(saleArtwork.sale_id).then((sale) =>
            isBiddable(sale, saleArtwork)
          )
        },
      },
      isHighestBidder: {
        type: GraphQLBoolean,
        description:
          "Is the user the highest bidder on the sale artwork. (Currently only being used via me.myBids.)",
        // TODO: This is currently only used via the `me.myBids` field. We can
        // update once we've finished migrating Causality over.
        resolve: (saleArtwork) => {
          return Boolean(saleArtwork.isHighestBidder)
        },
      },
      isWatching: {
        type: GraphQLBoolean,
        description:
          "True if this sale artwork is being watched by a user and they have not bid on it. (Currently only used on me.myBids and me.watchedLotsConnection.)",
        // TODO: At some point we might want to migrate this property to Gravity
        resolve: (saleArtwork) => {
          return Boolean(saleArtwork.isWatching)
        },
      },
      isWithReserve: {
        type: GraphQLBoolean,
        resolve: ({ reserve_status }) => reserve_status !== "no_reserve",
      },
      lotState: {
        type: CausalityLotState,
      },
      lotLabel: {
        type: GraphQLString,
        args: {
          trim: {
            type: GraphQLBoolean,
            description:
              "Whether to trim anything past the first alphanumeric chunk",
            defaultValue: false,
          },
        },
        resolve: ({ lot_label }, { trim }) =>
          trim ? lot_label?.match(/\S+/)?.shift() : lot_label,
      },
      lotID: {
        type: GraphQLString,
        resolve: ({ lot_id }) => lot_id,
      },
      lowEstimate: money({
        name: "SaleArtworkLowEstimate",
        resolve: ({ display_low_estimate_dollars, low_estimate_cents }) => ({
          cents: low_estimate_cents,
          display: display_low_estimate_dollars,
        }),
      }),
      minimumNextBid: money({
        name: "SaleArtworkMinimumNextBid",
        resolve: ({
          display_minimum_next_bid_dollars,
          minimum_next_bid_cents,
        }) => ({
          cents: minimum_next_bid_cents,
          display: display_minimum_next_bid_dollars,
        }),
      }),
      openingBid: money({
        name: "SaleArtworkOpeningBid",
        resolve: ({ display_opening_bid_dollars, opening_bid_cents }) => ({
          cents: opening_bid_cents,
          display: display_opening_bid_dollars,
        }),
      }),
      position: { type: GraphQLFloat },
      reserve: money({
        name: "SaleArtworkReserve",
        resolve: ({ display_reserve_dollars, reserve_cents }) => ({
          cents: reserve_cents,
          display: display_reserve_dollars,
        }),
      }),
      reserveMessage: {
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
      reserveStatus: {
        type: GraphQLString,
        resolve: ({ reserve_status }) => reserve_status,
      },
      saleID: {
        type: GraphQLString,
        resolve: ({ sale_id }) => sale_id,
      },
      sale: {
        type: Sale.type,
        resolve: ({ sale, sale_id }, _options, { saleLoader }) => {
          if (!!sale) return sale
          return saleLoader(sale_id)
        },
      },
      calculatedCost: {
        type: CalculatedCost,
        args: {
          bidAmountMinor: {
            type: new GraphQLNonNull(GraphQLInt),
            description: "Max bid price for the sale artwork",
          },
        },
        resolve: async (
          { id, sale_id },
          { bidAmountMinor },
          { saleArtworkCalculatedCostLoader }
        ) => {
          const data = await saleArtworkCalculatedCostLoader({
            saleId: sale_id,
            saleArtworkId: id,
            bidAmountMinor,
          })

          return {
            buyersPremium: {
              cents: data.buyers_premium_cents,
              display: data.display_buyers_premium,
              currency: data.currency,
            },
            subtotal: {
              cents: data.subtotal_cents,
              display: data.display_subtotal,
              currency: data.currency,
            },
            bidAmount: {
              cents: data.bid_amount_cents,
              display: data.display_bid_amount,
              currency: data.currency,
            },
          }
        },
      },
      symbol: {
        type: GraphQLString,
        description: `Currency symbol (e.g. "$")`,
      },
    }
  },
})

const SaleArtwork: GraphQLFieldConfig<void, ResolverContext> = {
  type: SaleArtworkType,
  description: "A Sale Artwork",
  args: {
    id: {
      type: new GraphQLNonNull(GraphQLString),
      description: "The slug or ID of the SaleArtwork",
    },
  },
  resolve: async (_root, { id }, { saleArtworkRootLoader }) => {
    const data = await saleArtworkRootLoader(id)
    return data
  },
}

export default SaleArtwork
