import Artwork from "schema/artwork"
import Image from "schema/image/index"
import Profile from "schema/profile"
import SaleArtwork from "schema/sale_artwork"
import cached from "schema/fields/cached"
import date from "schema/fields/date"
import gravity from "lib/loaders/legacy/gravity"
import moment from "moment"
import { GravityIDFields } from "schema/object_identification"
import { amount } from "schema/fields/money"
import { exclude } from "lib/helpers"
import { map } from "lodash"

import {
  GraphQLString,
  GraphQLObjectType,
  GraphQLNonNull,
  GraphQLList,
  GraphQLBoolean,
  GraphQLInt,
  GraphQLFloat,
} from "graphql"

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

const SaleType = new GraphQLObjectType({
  name: "Sale",
  fields: () => {
    return {
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
        resolve: ({ id }, options) => {
          const invert = saleArtworks => map(saleArtworks, "artwork")

          if (options.all) {
            return gravity
              .all(`sale/${id}/sale_artworks`, options)
              .then(invert)
              .then(exclude(options.exclude, "id"))
          }

          return gravity(`sale/${id}/sale_artworks`, options)
            .then(invert)
            .then(exclude(options.exclude, "id"))
        },
      },
      associated_sale: {
        type: SaleType,
        resolve: ({ associated_sale }) => {
          if (associated_sale && associated_sale.id) {
            return gravity(`sale/${associated_sale.id}`)
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
        resolve: sale => gravity(`increments`, { key: sale.increment_strategy }).then(incs => incs[0].increments),
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
        resolve: ({ auction_state, live_start_at }) => {
          const liveStart = moment(live_start_at)
          return auction_state === "open" && (moment().isAfter(liveStart) || moment().isSame(liveStart))
        },
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
      profile: {
        type: Profile.type,
        resolve: ({ profile }) => profile,
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
        resolve: ({ id }, options) => {
          if (options.all) {
            return gravity.all(`sale/${id}/sale_artworks`, options)
          }

          return gravity(`sale/${id}/sale_artworks`, options)
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
        resolve: (sale, { id }) => gravity(`sale/${sale.id}/sale_artwork/${id}`),
      },
      symbol: {
        type: GraphQLString,
      },
    }
  },
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
  resolve: (root, { id }) => gravity(`sale/${id}`),
}

export default Sale
