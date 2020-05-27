import Artwork, { artworkConnection } from "schema/v1/artwork"
import Bidder from "schema/v1/bidder"
import Image from "schema/v1/image/index"
import Profile from "schema/v1/profile"
import Partner from "schema/v1/partner"
import { SaleArtworkType } from "schema/v1/sale_artwork"
import initials from "schema/v1/fields/initials"
import cached from "schema/v1/fields/cached"
import date from "schema/v1/fields/date"
import moment from "moment"
import { SlugAndInternalIDFields } from "schema/v1/object_identification"
import { formattedStartDateTime } from "lib/date"
import { pageable, getPagingParameters } from "relay-cursor-paging"
import { connectionFromArraySlice, connectionDefinitions } from "graphql-relay"
import { amount } from "schema/v1/fields/money"
import { convertConnectionArgsToGravityArgs } from "lib/helpers"
import { map } from "lodash"
import { NodeInterface } from "schema/v1/object_identification"
import { allViaLoader } from "lib/all"
import { isLiveOpen, displayTimelyAt } from "./display"
import { flatten, isEmpty } from "lodash"

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
} from "graphql"

import config from "config"
import { ResolverContext } from "types/graphql"
import { deprecate } from "lib/deprecation"

const { PREDICTION_ENDPOINT } = config

const DEFAULT_TZ = "UTC"

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
    ...SlugAndInternalIDFields,
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
      artworks: {
        type: new GraphQLList(Artwork.type),
        args: {
          page: { type: GraphQLInt, defaultValue: 1 },
          size: { type: GraphQLInt, defaultValue: 25 },
          all: { type: GraphQLBoolean, defaultValue: false },
          exclude: {
            type: new GraphQLList(GraphQLString),
            description:
              "List of artwork IDs to exclude from the response (irrespective of size)",
          },
        },
        resolve: ({ id }, options, { saleArtworksLoader }) => {
          let fetch: Promise<any>

          if (options.exclude) {
            options.exclude_ids = flatten([options.exclude])
            delete options.exclude
          }

          if (options.all) {
            fetch = allViaLoader(saleArtworksLoader, {
              path: id,
              params: options,
            })
          } else {
            fetch = saleArtworksLoader(id, options).then(({ body }) => body)
          }
          // FIXME: Object is possibly 'null'
          // @ts-ignore
          return fetch.then((saleArtworks) => map(saleArtworks, "artwork"))
        },
      },
      artworksConnection: {
        type: artworkConnection,
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
      associated_sale: {
        type: SaleType,
        resolve: ({ associated_sale }, _options, { saleLoader }) => {
          if (associated_sale && associated_sale.id) {
            return saleLoader(associated_sale.id)
          }
          return null
        },
      },
      auction_state: {
        type: GraphQLString,
        resolve: ({ auction_state }) => auction_state,
        deprecationReason: deprecate({
          inVersion: 2,
          preferUsageOf: "status",
        }),
      },
      bid_increments: {
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
      buyers_premium: {
        type: new GraphQLList(BuyersPremium),
        description: "Auction's buyer's premium policy.",
        resolve: (sale) => {
          if (!sale.buyers_premium) return null

          return map(sale.buyers_premium.schedule, (item: any) => ({
            cents: item.min_amount_cents,
            symbol: sale.currency,
            percent: item.percent,
          }))
        },
      },
      cover_image: Image,
      currency: { type: GraphQLString },
      description: { type: GraphQLString },
      display_timely_at: {
        type: GraphQLString,
        resolve: (sale, _options, { meBiddersLoader }) => {
          return displayTimelyAt({ sale, meBiddersLoader })
        },
      },
      eligible_sale_artworks_count: { type: GraphQLInt },
      end_at: date,
      event_start_at: date,
      event_end_at: date,
      formattedStartDateTime: {
        type: GraphQLString,
        description:
          "A formatted description of when the auction starts or ends or if it has ended",
        resolve: (
          { start_at, end_at, ended_at, live_start_at },
          _options,
          { defaultTimezone }
        ) =>
          formattedStartDateTime(
            start_at,
            ended_at || end_at,
            live_start_at,
            defaultTimezone || DEFAULT_TZ
          ),
      },
      href: { type: GraphQLString, resolve: ({ id }) => `/auction/${id}` },
      name: { type: GraphQLString },
      initials: initials("name"),
      is_auction: { type: GraphQLBoolean },
      is_benefit: {
        type: GraphQLBoolean,
        deprecationReason: deprecate({
          inVersion: 2,
          preferUsageOf: "isBenefit",
        }),
      },
      isBenefit: {
        type: GraphQLBoolean,
        resolve: ({ is_benefit }) => is_benefit,
      },
      isGalleryAuction: {
        type: GraphQLBoolean,
        resolve: ({ is_gallery_auction }) => is_gallery_auction,
      },
      is_auction_promo: {
        type: GraphQLBoolean,
        resolve: ({ sale_type }) => sale_type === "auction promo",
      },
      is_closed: {
        type: GraphQLBoolean,
        resolve: ({ auction_state }) => auction_state === "closed",
      },
      is_open: {
        type: GraphQLBoolean,
        resolve: ({ auction_state }) => auction_state === "open",
      },
      is_live_open: { type: GraphQLBoolean, resolve: isLiveOpen },
      is_preview: {
        type: GraphQLBoolean,
        resolve: ({ auction_state }) => auction_state === "preview",
      },
      is_preliminary: {
        type: GraphQLBoolean,
      },
      is_registration_closed: {
        type: GraphQLBoolean,
        resolve: ({ registration_ends_at }) =>
          moment().isAfter(registration_ends_at),
      },
      is_with_buyers_premium: {
        type: GraphQLBoolean,
        resolve: ({ buyers_premium }) => !!buyers_premium,
      },
      live_start_at: date,
      live_url_if_open: {
        type: GraphQLString,
        description:
          "Returns a live auctions url if the sale is open and start time is after now",
        resolve: (sale) => {
          if (isLiveOpen(sale)) {
            return PREDICTION_ENDPOINT + "/" + sale.id
          }
        },
      }, // Only fetches the partner info that's already included in the Sale object
      // since we don't (at this time) need to load the full Partner object.
      partner: { type: Partner.type, resolve: ({ partner }) => partner },
      profile: { type: Profile.type, resolve: ({ profile }) => profile },
      promoted_sale: {
        type: SaleType,
        resolve: ({ promoted_sale }, _options, { saleLoader }) => {
          if (promoted_sale && promoted_sale.id) {
            return saleLoader(promoted_sale.id)
          }
          return null
        },
      },
      registration_ends_at: date,
      registrationStatus: {
        type: Bidder.type,
        description: "A registration for this sale or null",
        resolve: ({ id }, _args, { meBiddersLoader }) => {
          if (!meBiddersLoader) return null
          return meBiddersLoader({ sale_id: id }).then(([bidder]) => bidder)
        },
      },
      require_bidder_approval: { type: GraphQLBoolean },
      sale_artworks: {
        type: new GraphQLList(SaleArtworkType),
        args: {
          page: { type: GraphQLInt, defaultValue: 1 },
          size: { type: GraphQLInt, defaultValue: 25 },
          all: { type: GraphQLBoolean, defaultValue: false },
        },
        resolve: ({ id }, options, { saleArtworksLoader }) => {
          let fetch: Promise<any>
          if (options.all) {
            fetch = allViaLoader(saleArtworksLoader, {
              path: id,
              params: options,
            })
          } else {
            fetch = saleArtworksLoader(id, options).then(({ body }) => body)
          }

          return fetch
        },
      },
      sale_artworks_connection: {
        type: saleArtworkConnection,
        args: pageable({
          ids: {
            type: new GraphQLList(GraphQLID),
            description: "List of sale artwork IDs to fetch",
          },
        }),
        resolve: (sale, options, { saleArtworksLoader }) => {
          const { limit: size, offset } = getPagingParameters(options)

          const { ids } = options

          if (ids !== undefined && isEmpty(ids)) {
            return connectionFromArraySlice([], options, {
              arrayLength: 0,
              sliceStart: 0,
            })
          }

          return saleArtworksLoader(sale.id, {
            size,
            offset,
            ids,
          }).then(({ body }) => {
            let meta
            if (ids) {
              meta = {
                arrayLength: body && body.length,
                sliceStart: 0,
              }
            } else {
              meta = {
                arrayLength: sale.eligible_sale_artworks_count,
                sliceStart: offset,
              }
            }

            return connectionFromArraySlice(body, options, meta)
          })
        },
      },
      sale_type: { type: GraphQLString },
      start_at: date,
      status: {
        type: GraphQLString,
        resolve: ({ auction_state }) => auction_state,
      },
      sale_artwork: {
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
