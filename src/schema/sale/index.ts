import Artwork, { artworkConnection } from "schema/artwork"
import Bidder from "schema/bidder"
import Image from "schema/image/index"
import Profile from "schema/profile"
import Partner from "schema/partner"
import SaleArtwork from "schema/sale_artwork"
import cached from "schema/fields/cached"
import date from "schema/fields/date"
import moment from "moment"
import { GravityIDFields } from "schema/object_identification"
import { pageable, getPagingParameters } from "relay-cursor-paging"
import { connectionFromArraySlice, connectionDefinitions } from "graphql-relay"
import { amount } from "schema/fields/money"
import { convertConnectionArgsToGravityArgs } from "lib/helpers"
import { map } from "lodash"
import { NodeInterface } from "schema/object_identification"
import { allViaLoader } from "../../lib/all"
import { isLiveOpen, displayTimelyAt } from "./display"
import { flatten } from "lodash"

import {
  GraphQLString,
  GraphQLObjectType,
  GraphQLNonNull,
  GraphQLList,
  GraphQLBoolean,
  GraphQLInt,
  GraphQLFloat,
  GraphQLFieldConfig,
} from "graphql"

import config from "config"
import { ResolverContext } from "types/graphql"

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
    ...GravityIDFields,
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
  nodeType: SaleArtwork.type,
}).connectionType

export const SaleType = new GraphQLObjectType<any, ResolverContext>({
  name: "Sale",
  interfaces: [NodeInterface],
  fields: () => {
    return {
      ...GravityIDFields,
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
          return fetch.then(saleArtworks => map(saleArtworks, "artwork"))
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
          const gravityArgs: GravityArgs = {
            page,
            size,
          }

          if (options.exclude) {
            gravityArgs.exclude_ids = flatten([options.exclude])
          }

          return saleArtworksLoader(id, gravityArgs)
            .then(({ body }) => map(body, "artwork"))
            .then(body => {
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
        deprecationReason: "Favor `status` for consistency with other models",
      },
      bid_increments: {
        type: new GraphQLList(BidIncrement),
        description:
          "A bid increment policy that explains minimum bids in ranges.",
        resolve: (sale, _options, { incrementsLoader }) => {
          return incrementsLoader({
            key: sale.increment_strategy,
          }).then(increments => {
            return increments[0].increments
          })
        },
      },
      buyers_premium: {
        type: new GraphQLList(BuyersPremium),
        description: "Auction's buyer's premium policy.",
        resolve: sale => {
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
      href: { type: GraphQLString, resolve: ({ id }) => `/auction/${id}` },
      name: { type: GraphQLString },
      is_auction: { type: GraphQLBoolean },
      is_benefit: { type: GraphQLBoolean },
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
      is_registration_closed: {
        type: GraphQLBoolean,
        resolve: ({ registration_ends_at }) =>
          moment().isAfter(registration_ends_at),
      },
      is_with_buyers_premium: {
        type: GraphQLBoolean,
        resolve: ({ buyers_premium }) => buyers_premium,
      },
      live_start_at: date,
      live_url_if_open: {
        type: GraphQLString,
        description:
          "Returns a live auctions url if the sale is open and start time is after now",
        resolve: sale => {
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
        type: new GraphQLList(SaleArtwork.type),
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
        args: pageable(),
        resolve: (sale, options, { saleArtworksLoader }) => {
          const { limit: size, offset } = getPagingParameters(options)
          return saleArtworksLoader(sale.id, {
            size,
            offset,
          }).then(({ body }) =>
            connectionFromArraySlice(body, options, {
              arrayLength: sale.eligible_sale_artworks_count,
              sliceStart: offset,
            })
          )
        },
      },
      sale_type: { type: GraphQLString },
      start_at: date,
      status: {
        type: GraphQLString,
        resolve: ({ auction_state }) => auction_state,
      },
      sale_artwork: {
        type: SaleArtwork.type,
        args: { id: { type: new GraphQLNonNull(GraphQLString) } },
        resolve: (sale, { id }, { saleArtworkLoader }) => {
          return saleArtworkLoader({ saleId: sale.id, saleArtworkId: id })
        },
      },
      symbol: { type: GraphQLString },
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
