import Artwork, { artworkConnection } from "schema/v2/artwork"
import Bidder from "schema/v2/bidder"
import Image from "schema/v2/image/index"
import Profile from "schema/v2/profile"
import Partner from "schema/v2/partner"
import SaleArtwork from "schema/v2/sale_artwork"
import initials from "schema/v2/fields/initials"
import cached from "schema/v2/fields/cached"
import date from "schema/v2/fields/date"
import moment from "moment"
import { SlugAndInternalIDFields } from "schema/v2/object_identification"
import { formattedStartDateTime } from "lib/date"
import { pageable, getPagingParameters } from "relay-cursor-paging"
import { connectionFromArraySlice, connectionDefinitions } from "graphql-relay"
import { amount } from "schema/v2/fields/money"
import { convertConnectionArgsToGravityArgs } from "lib/helpers"
import { map } from "lodash"
import { NodeInterface } from "schema/v2/object_identification"
import { allViaLoader } from "lib/all"
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
  nodeType: SaleArtwork.type,
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
          return fetch.then(saleArtworks => map(saleArtworks, "artwork"))
        },
      },
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
            .then(body => {
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
      bidIncrements: {
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
      buyersPremium: {
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
      coverImage: Image,
      currency: { type: GraphQLString },
      description: { type: GraphQLString },
      displayTimelyAt: {
        type: GraphQLString,
        resolve: (sale, _options, { meBiddersLoader }) => {
          return displayTimelyAt({ sale, meBiddersLoader })
        },
      },
      eligibleSaleArtworksCount: {
        type: GraphQLInt,
        resolve: ({ eligible_sale_artworks_count }) =>
          eligible_sale_artworks_count,
      },
      endAt: date,
      eventStartAt: date,
      eventEndAt: date,
      formattedStartDateTime: {
        type: GraphQLString,
        description:
          "A formatted description of when the auction starts or ends or if it has ended",
        resolve: ({ start_at, end_at }) =>
          formattedStartDateTime(start_at, end_at, "UTC"),
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
      isRegistrationClosed: {
        type: GraphQLBoolean,
        resolve: ({ registration_ends_at }) =>
          moment().isAfter(registration_ends_at),
      },
      isWithBuyersPremium: {
        type: GraphQLBoolean,
        resolve: ({ buyers_premium }) => buyers_premium,
      },
      liveStartAt: date,
      // Only fetches the partner info that's already included in the Sale object
      liveURLIfOpen: {
        type: GraphQLString,
        description:
          "Returns a live auctions url if the sale is open and start time is after now",
        resolve: sale => {
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
      saleArtworks: {
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
      saleArtworksConnection: {
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
