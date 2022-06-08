import { artworkConnection } from "schema/v2/artwork"
import Bidder from "schema/v2/bidder"
import Image from "schema/v2/image/index"
import Profile from "schema/v2/profile"
import Partner from "schema/v2/partner"
import { SaleArtworkType } from "schema/v2/sale_artwork"
import initials from "schema/v2/fields/initials"
import cached from "schema/v2/fields/cached"
import date from "schema/v2/fields/date"
import moment from "moment"
import { SlugAndInternalIDFields } from "schema/v2/object_identification"
import {
  formattedStartDateTime,
  cascadingFormattedStartDateTime,
  auctionsDetailFormattedStartDateTime,
  DEFAULT_TZ,
} from "lib/date"
import { pageable, getPagingParameters } from "relay-cursor-paging"
import {
  connectionFromArraySlice,
  connectionDefinitions,
  connectionFromArray,
} from "graphql-relay"
import { amount } from "schema/v2/fields/money"
import { convertConnectionArgsToGravityArgs } from "lib/helpers"
import { map } from "lodash"
import { NodeInterface } from "schema/v2/object_identification"
import { isLiveOpen, displayTimelyAt } from "./display"
import { flatten, first, isEmpty } from "lodash"

import {
  GraphQLString,
  GraphQLObjectType,
  GraphQLNonNull,
  GraphQLList,
  GraphQLBoolean,
  GraphQLInt,
  GraphQLFloat,
  GraphQLFieldConfig,
  GraphQLID,
  GraphQLEnumType,
} from "graphql"

import config from "config"
import { ResolverContext } from "types/graphql"
import { allViaLoader } from "lib/all"
import { markdown } from "../fields/markdown"

const { PREDICTION_ENDPOINT } = config

const BidIncrement = new GraphQLObjectType<any, ResolverContext>({
  name: "BidIncrement",
  fields: {
    amount: {
      type: GraphQLInt,
    },
    from: {
      type: GraphQLInt,
    },
    to: {
      type: GraphQLInt,
    },
  },
})

const BuyersPremium = new GraphQLObjectType<any, ResolverContext>({
  name: "BuyersPremium",
  fields: {
    amount: amount(({ cents }) => cents),
    cents: {
      type: GraphQLInt,
      resolve: ({ cents }) => cents,
    },
    percent: {
      type: GraphQLFloat,
    },
  },
})

const saleArtworkConnection = connectionDefinitions({
  nodeType: SaleArtworkType,
}).connectionType

export const SaleType = new GraphQLObjectType<any, ResolverContext>({
  name: "Sale",
  interfaces: [NodeInterface],
  fields: () => {
    return {
      ...SlugAndInternalIDFields,
      cached,
      artworksConnection: {
        type: artworkConnection.connectionType,
        description: "Returns a connection of artworks for a sale.",
        args: pageable({
          exclude: {
            type: new GraphQLList(GraphQLString),
            description:
              "List of artwork IDs to exclude from the response (irrespective of size)",
          },
        }),
        resolve: (
          { eligible_sale_artworks_count, id },
          options,
          { saleArtworksLoader }
        ) => {
          const { page, size, offset } = convertConnectionArgsToGravityArgs(
            options
          )
          interface GravityArgs {
            exclude_ids?: string[]
            page: number
            size: number
          }
          const gravityArgs: GravityArgs = { page, size }

          if (options.exclude) {
            gravityArgs.exclude_ids = flatten([options.exclude])
          }

          return saleArtworksLoader(id, gravityArgs)
            .then(({ body }) => map(body, "artwork"))
            .then((body) => {
              return connectionFromArraySlice(body, options, {
                arrayLength: eligible_sale_artworks_count,
                sliceStart: offset,
              })
            })
        },
      },
      associatedSale: {
        type: SaleType,
        resolve: ({ associated_sale }, _options, { saleLoader }) => {
          if (associated_sale && associated_sale.id) {
            return saleLoader(associated_sale.id)
          }
          return null
        },
      },
      bidder: {
        type: Bidder.type,
        resolve: async ({ id }, _options, { meBiddersLoader }) => {
          if (!meBiddersLoader) {
            return null
          }
          // TODO: Look into possibly batching this.
          // @see https://github.com/artsy/gravity/blob/master/app/api/v1/me_bidders_endpoint.rb
          const bidders = await meBiddersLoader({ sale_id: id })
          return first(bidders)
        },
      },
      bidIncrements: {
        type: new GraphQLList(BidIncrement),
        description:
          "A bid increment policy that explains minimum bids in ranges.",
        resolve: (sale, _options, { incrementsLoader }) => {
          return incrementsLoader({
            key: sale.increment_strategy,
          }).then((increments) => {
            return increments[0].increments
          })
        },
      },
      buyersPremium: {
        type: new GraphQLList(BuyersPremium),
        description: "Auction's buyer's premium policy.",
        resolve: (sale) => {
          if (!sale.buyers_premium) return null

          return map(sale.buyers_premium.schedule, (item: any) => ({
            cents: item.min_amount_cents,
            symbol: sale.symbol,
            percent: item.percent,
          }))
        },
      },
      cascadingEndTimeIntervalMinutes: {
        type: GraphQLInt,
        description: "Amount of minutes in between each lot closing.",
        resolve: ({ cascading_end_time_interval_minutes }) =>
          cascading_end_time_interval_minutes,
      },
      collectPayments: {
        type: new GraphQLNonNull(GraphQLBoolean),
        resolve: ({ collect_payments }) => !!collect_payments,
      },
      coverImage: Image,
      currency: { type: GraphQLString },
      description: markdown(),
      displayTimelyAt: {
        type: GraphQLString,
        resolve: (sale, _options, { meBiddersLoader, defaultTimezone }) => {
          return displayTimelyAt({
            sale,
            meBiddersLoader,
            timeZone: defaultTimezone || DEFAULT_TZ,
          })
        },
      },
      eligibleSaleArtworksCount: {
        type: GraphQLInt,
        resolve: ({ eligible_sale_artworks_count }) =>
          eligible_sale_artworks_count,
      },
      endAt: date,
      endedAt: date,
      eventStartAt: date,
      eventEndAt: date,
      extendedBiddingIntervalMinutes: {
        type: GraphQLInt,
        description: "Amount of time added when a late bid comes in.",
        resolve: ({ extended_bidding_interval_minutes }) =>
          extended_bidding_interval_minutes,
      },
      extendedBiddingPeriodMinutes: {
        type: GraphQLInt,
        description:
          "Duration before lot closes that a late bid would extend the end time.",
        resolve: ({ extended_bidding_period_minutes }) =>
          extended_bidding_period_minutes,
      },
      formattedStartDateTime: {
        type: GraphQLString,
        description:
          "A formatted description of when the auction starts or ends or if it has ended",
        resolve: (
          {
            start_at,
            end_at,
            ended_at,
            live_start_at,
            cascading_end_time_interval_minutes,
          },
          _options,
          { defaultTimezone }
        ) => {
          if (cascading_end_time_interval_minutes) {
            return cascadingFormattedStartDateTime(
              start_at,
              end_at,
              ended_at,
              defaultTimezone
            )
          } else {
            return formattedStartDateTime(
              start_at,
              ended_at || end_at,
              live_start_at,
              defaultTimezone
            )
          }
        },
      },
      cascadingEndTime: {
        type: new GraphQLObjectType({
          name: "SaleCascadingEndTime",
          fields: {
            formattedStartDateTime: {
              type: GraphQLString,
              description:
                "A more granular formatted description of when the auction starts or ends if it has ended",
              resolve: (
                { start_at, end_at, ended_at, live_start_at },
                _options,
                { defaultTimezone }
              ) => {
                return auctionsDetailFormattedStartDateTime(
                  start_at,
                  end_at,
                  ended_at,
                  live_start_at,
                  defaultTimezone
                )
              },
            },
            intervalLabel: {
              type: GraphQLString,
              description:
                "A label indicating the interval in minutes in which lots close",
              resolve: (
                { ended_at, cascading_end_time_interval_minutes },
                _options
              ) => {
                if (!cascading_end_time_interval_minutes) return null
                if (ended_at) {
                  return null
                } else {
                  return `Lots close at ${cascading_end_time_interval_minutes}-minute intervals`
                }
              },
            },
          },
        }),
        resolve: (sale) => {
          return {
            start_at: sale.start_at,
            end_at: sale.end_at,
            ended_at: sale.ended_at,
            live_start_at: sale.live_start_at,
            cascading_end_time_interval_minutes:
              sale.cascading_end_time_interval_minutes,
          }
        },
      },
      href: { type: GraphQLString, resolve: ({ id }) => `/auction/${id}` },
      name: { type: GraphQLString },
      initials: initials("name"),
      isAuction: {
        type: GraphQLBoolean,
        resolve: ({ is_auction }) => is_auction,
      },
      isBenefit: {
        type: GraphQLBoolean,
        resolve: ({ is_benefit }) => is_benefit,
      },
      isGalleryAuction: {
        type: GraphQLBoolean,
        resolve: ({ is_gallery_auction }) => is_gallery_auction,
      },
      isArtsyLicensed: {
        type: new GraphQLNonNull(GraphQLBoolean),
        resolve: ({ is_artsy_licensed }) => is_artsy_licensed,
      },
      isAuctionPromo: {
        type: GraphQLBoolean,
        resolve: ({ sale_type }) => sale_type === "auction promo",
      },
      isClosed: {
        type: GraphQLBoolean,
        resolve: ({ auction_state }) => auction_state === "closed",
      },
      isOpen: {
        type: GraphQLBoolean,
        resolve: ({ auction_state }) => auction_state === "open",
      },
      isLiveOpen: { type: GraphQLBoolean, resolve: isLiveOpen },
      isPreview: {
        type: GraphQLBoolean,
        resolve: ({ auction_state }) => auction_state === "preview",
      },
      isPreliminary: {
        type: GraphQLBoolean,
        resolve: ({ is_preliminary }) => is_preliminary,
      },
      isRegistrationClosed: {
        type: GraphQLBoolean,
        resolve: ({ registration_ends_at }) =>
          moment().isAfter(registration_ends_at),
      },
      isWithBuyersPremium: {
        type: GraphQLBoolean,
        resolve: ({ buyers_premium }) => !!buyers_premium,
      },
      isLotConditionsReportEnabled: {
        type: GraphQLBoolean,
        resolve: ({ lot_conditions_report_enabled }) =>
          !!lot_conditions_report_enabled,
      },
      liveStartAt: date,
      // Only fetches the partner info that's already included in the Sale object
      liveURLIfOpen: {
        type: GraphQLString,
        description:
          "Returns a live auctions url if the sale is open and start time is after now",
        resolve: (sale) => {
          if (isLiveOpen(sale)) {
            return PREDICTION_ENDPOINT + "/" + sale.id
          }
        },
      },
      // since we don't (at this time) need to load the full Partner object.
      partner: { type: Partner.type, resolve: ({ partner }) => partner },
      profile: { type: Profile.type, resolve: ({ profile }) => profile },
      promotedSale: {
        type: SaleType,
        resolve: ({ promoted_sale }, _options, { saleLoader }) => {
          if (promoted_sale && promoted_sale.id) {
            return saleLoader(promoted_sale.id)
          }
          return null
        },
      },
      registrationEndsAt: date,
      registrationStatus: {
        type: Bidder.type,
        description: "A registration for this sale or null",
        resolve: ({ id }, _args, { meBiddersLoader }) => {
          if (!meBiddersLoader) return null
          return meBiddersLoader({ sale_id: id }).then(([bidder]) => bidder)
        },
      },
      requireBidderApproval: {
        type: GraphQLBoolean,
        resolve: ({ require_bidder_approval }) => require_bidder_approval,
      },
      requireIdentityVerification: {
        type: GraphQLBoolean,
        resolve: ({ require_identity_verification }) =>
          require_identity_verification,
      },
      userNeedsIdentityVerification: {
        type: GraphQLBoolean,
        description:
          "True if the current user needs to undergo identity verification for this sale, false otherwise",
        resolve: (
          { require_identity_verification, id },
          _options,
          { meLoader, meBiddersLoader }
        ) => {
          if (!require_identity_verification) return false
          if (!meLoader || !meBiddersLoader) return true

          return meBiddersLoader({ sale_id: id }).then((bidders) => {
            if (bidders.length > 0) {
              const bidder = bidders[0]
              return bidder.needs_identity_verification
            } else {
              return meLoader().then(({ identity_verified }) => {
                return !identity_verified
              })
            }
          })
        },
      },
      saleArtworksConnection: {
        type: saleArtworkConnection,
        args: pageable({
          internalIDs: {
            type: new GraphQLList(GraphQLID),
            description: "List of sale artwork internal IDs to fetch",
          },
          all: { type: GraphQLBoolean, defaultValue: false },
          status: {
            type: new GraphQLEnumType({
              name: "SaleArtworkStatus",
              values: {
                OPEN: {
                  value: "open",
                },
                CLOSED: {
                  value: "closed",
                },
              },
            }),
          },
        }),
        resolve: (sale, options, { saleArtworksLoader }) => {
          const { limit: size, offset } = getPagingParameters(options)
          const { internalIDs: ids, status } = options
          if (ids !== undefined && isEmpty(ids)) {
            return connectionFromArraySlice([], options, {
              arrayLength: 0,
              sliceStart: 0,
            })
          }

          if (options.all) {
            return allViaLoader(saleArtworksLoader, {
              path: sale.id,
            }).then((body) => connectionFromArray(body, {}))
          } else {
            const gravityArgs = {
              size,
              offset,
              ids,
              ...(status && { status, total_count: true }),
            }
            return saleArtworksLoader(sale.id, gravityArgs).then(
              ({ body, headers }) => {
                let meta
                if (ids) {
                  meta = {
                    arrayLength: body && body.length,
                    sliceStart: 0,
                  }
                } else {
                  const count = parseInt(headers["x-total-count"] || "0", 10)
                  meta = {
                    arrayLength: count || sale.eligible_sale_artworks_count,
                    sliceStart: offset,
                  }
                }
                return connectionFromArraySlice(body, options, meta)
              }
            )
          }
        },
      },
      saleType: {
        type: GraphQLString,
        resolve: ({ sale_type }) => sale_type,
      },
      startAt: date,
      status: {
        type: GraphQLString,
        resolve: ({ auction_state }) => auction_state,
      },
      saleArtwork: {
        type: SaleArtworkType,
        args: { id: { type: new GraphQLNonNull(GraphQLString) } },
        resolve: (sale, { id }, { saleArtworkLoader }) => {
          return saleArtworkLoader({ saleId: sale.id, saleArtworkId: id })
        },
      },
      symbol: { type: GraphQLString },
      timeZone: {
        type: GraphQLString,
        resolve: ({ time_zone }) => time_zone,
      },
    }
  },
})

const Sale: GraphQLFieldConfig<void, ResolverContext> = {
  type: SaleType,
  description: "A Sale",
  args: {
    id: {
      type: new GraphQLNonNull(GraphQLString),
      description: "The slug or ID of the Sale",
    },
  },
  resolve: (_root, { id }, { saleLoader }) => saleLoader(id),
}

export default Sale
