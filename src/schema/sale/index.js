import Artwork from "schema/artwork"
import Image from "schema/image/index"
import Profile from "schema/profile"
import SaleArtwork from "schema/sale_artwork"
import cached from "schema/fields/cached"
import date from "schema/fields/date"
import moment from "moment"
import { GravityIDFields, NodeInterface } from "schema/object_identification"
import { pageable, getPagingParameters } from "relay-cursor-paging"
import { connectionFromArraySlice, connectionDefinitions } from "graphql-relay"
import { amount } from "schema/fields/money"
import { exclude } from "lib/helpers"
import { map } from "lodash"
import { allViaLoader } from "../../lib/all"

import {
  GraphQLString,
  GraphQLObjectType,
  GraphQLNonNull,
  GraphQLList,
  GraphQLBoolean,
  GraphQLInt,
  GraphQLFloat,
} from "graphql"

import config from "config"

const { PREDICTION_ENDPOINT } = config

const isLiveOpen = sale => {
  const liveStart = moment(sale.live_start_at)
  return sale.auction_state === "open" && (moment().isAfter(liveStart) || moment().isSame(liveStart))
}

const BidIncrement = new GraphQLObjectType({
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

const BuyersPremium = new GraphQLObjectType({
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

export const SaleType = new GraphQLObjectType({
  name: "Sale",
  interfaces: [NodeInterface],
  fields: () => ({
    ...GravityIDFields,
    cached,
    artworks: {
      type: new GraphQLList(Artwork.type),
      args: {
        page: {
          type: GraphQLInt,
          defaultValue: 1,
        },
        size: {
          type: GraphQLInt,
          defaultValue: 25,
        },
        all: {
          type: GraphQLBoolean,
          defaultValue: false,
        },
        exclude: {
          type: new GraphQLList(GraphQLString),
          description: "List of artwork IDs to exclude from the response (irrespective of size)",
        },
      },
      resolve: ({ id }, options, request, { rootValue: { saleArtworksLoader } }) => {
        const invert = saleArtworks => map(saleArtworks, "artwork")
        let fetch = null
        if (options.all) {
          fetch = allViaLoader(saleArtworksLoader, id, options)
        } else {
          fetch = saleArtworksLoader(id, options).then(({ body }) => body)
        }

        return fetch.then(invert).then(exclude(options.exclude, "id"))
      },
    },
    associated_sale: {
      type: SaleType,
      resolve: ({ associated_sale }, options, request, { rootValue: { saleLoader } }) => {
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
      description: "A bid increment policy that explains minimum bids in ranges.",
      resolve: (sale, options, request, { rootValue: { incrementsLoader } }) =>
        incrementsLoader({ key: sale.increment_strategy }).then(increments => increments[0].increments),
    },
    buyers_premium: {
      type: new GraphQLList(BuyersPremium),
      description: "Auction's buyer's premium policy.",
      resolve: sale => {
        if (!sale.buyers_premium) return null

        return map(sale.buyers_premium.schedule, item => ({
          cents: item.min_amount_cents,
          symbol: sale.currency,
          percent: item.percent,
        }))
      },
    },
    cover_image: {
      type: Image.type,
      resolve: ({ image_versions, image_url }) => Image.resolve({ image_versions, image_url }),
    },
    currency: {
      type: GraphQLString,
    },
    description: {
      type: GraphQLString,
    },
    display_timely_at: {
      type: GraphQLString,
      resolve: sale => {
        const { live_start_at, registration_ends_at, start_at, end_at } = sale

        // Closed
        if (end_at && end_at < moment()) {
          return "Ended"

          // End Registration
        } else if (registration_ends_at > moment()) {
          const diff = moment().diff(moment(registration_ends_at), "hours")
          const format = diff > -24 ? "ha" : "MMM D, ha"
          const label = `Register by\n${moment(registration_ends_at).format(format)}`
          return label

          // Live Auction
        } else if (live_start_at) {
          if (isLiveOpen(sale)) {
            return "In Progress"

            // Live auction starting soon
          } else if (live_start_at) {
            return `Live ${moment(live_start_at).fromNow()}`
          }

          // Timed Auction
        } else if (start_at) {
          const range = moment().add(5, "days")
          const startAt = moment(start_at)
          const isInProgress = startAt < moment()
          const isUpcoming = startAt > moment() && startAt < range
          const isNearFuture = startAt > range
          const dateLabel = saleDate =>
            `${moment(saleDate)
              .fromNow()
              .replace("in ", "")
              .replace("ago", "")
              .trim()} left` // e.g., X min left

          // Timed auction in progress
          if (isInProgress) {
            return dateLabel(end_at)

            // Coming soon
          } else if (isUpcoming) {
            return dateLabel(start_at)

            // Coming in the future
          } else if (isNearFuture) {
            return `Ends on ${moment(end_at).format("MMM D, ha")}`
          }
        } else {
          return null
        }

        return undefined // make undefined an explicit return
      },
    },
    eligible_sale_artworks_count: {
      type: GraphQLInt,
    },
    end_at: date,
    event_start_at: date,
    event_end_at: date,
    href: {
      type: GraphQLString,
      resolve: ({ id }) => `/auction/${id}`,
    },
    name: {
      type: GraphQLString,
    },
    is_auction: {
      type: GraphQLBoolean,
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
    is_live_open: {
      type: GraphQLBoolean,
      resolve: isLiveOpen,
    },
    is_preview: {
      type: GraphQLBoolean,
      resolve: ({ auction_state }) => auction_state === "preview",
    },
    is_registration_closed: {
      type: GraphQLBoolean,
      resolve: ({ registration_ends_at }) => moment().isAfter(registration_ends_at),
    },
    is_with_buyers_premium: {
      type: GraphQLBoolean,
      resolve: ({ buyers_premium }) => buyers_premium,
    },
    live_start_at: date,
    live_url_if_open: {
      type: GraphQLString,
      description: "Returns a live auctions url if the sale is open and start time is after now",
      resolve: sale => {
        if (isLiveOpen(sale)) {
          return `${PREDICTION_ENDPOINT}/${sale.id}`
        }

        return undefined // make undefined return explicit
      },
    },
    profile: {
      type: Profile.type,
      resolve: ({ profile }) => profile,
    },
    promoted_sale: {
      type: SaleType,
      resolve: ({ promoted_sale }, options, request, { rootValue: { saleLoader } }) => {
        if (promoted_sale && promoted_sale.id) {
          return saleLoader(promoted_sale.id)
        }
        return null
      },
    },
    registration_ends_at: date,
    require_bidder_approval: {
      type: GraphQLBoolean,
    },
    sale_artworks: {
      type: new GraphQLList(SaleArtwork.type),
      args: {
        page: {
          type: GraphQLInt,
          defaultValue: 1,
        },
        size: {
          type: GraphQLInt,
          defaultValue: 25,
        },
        all: {
          type: GraphQLBoolean,
          defaultValue: false,
        },
      },
      resolve: ({ id }, options, request, { rootValue: { saleArtworksLoader } }) => {
        let fetch = null
        if (options.all) {
          fetch = allViaLoader(saleArtworksLoader, id, options)
        } else {
          fetch = saleArtworksLoader(id, options).then(({ body }) => body)
        }

        return fetch
      },
    },
    sale_artworks_connection: {
      type: saleArtworkConnection,
      args: pageable(),
      resolve: (sale, options, request, { rootValue: { saleArtworksLoader } }) => {
        const { limit: size, offset } = getPagingParameters(options)
        return saleArtworksLoader(sale.id, { size, offset }).then(({ body }) =>
          connectionFromArraySlice(body, options, {
            arrayLength: sale.eligible_sale_artworks_count,
            sliceStart: offset,
          })
        )
      },
    },
    sale_type: {
      type: GraphQLString,
    },
    start_at: date,
    status: {
      type: GraphQLString,
      resolve: ({ auction_state }) => auction_state,
    },
    sale_artwork: {
      type: SaleArtwork.type,
      args: {
        id: {
          type: new GraphQLNonNull(GraphQLString),
        },
      },
      resolve: (sale, { id }, request, { rootValue: { saleArtworkLoader } }) =>
        saleArtworkLoader({ saleId: sale.id, saleArtworkId: id }),
    },
    symbol: {
      type: GraphQLString,
    },
  }),
})

const Sale = {
  type: SaleType,
  description: "A Sale",
  args: {
    id: {
      type: new GraphQLNonNull(GraphQLString),
      description: "The slug or ID of the Sale",
    },
  },
  resolve: async (_root, { id }, _request, { rootValue: { saleLoader } }) => {
    const data = await saleLoader(id)
    return data
  },
}

export default Sale
