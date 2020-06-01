import { isExisty } from "lib/helpers"
import BidderPosition from "schema/v1/bidder_position"
import Bidder from "schema/v1/bidder"
import Sale from "schema/v1/sale"
import SaleArtwork from "schema/v1/sale_artwork"
import {
  GraphQLObjectType,
  GraphQLString,
  GraphQLBoolean,
  GraphQLFieldConfig,
} from "graphql"
import { ResolverContext } from "types/graphql"

// is leading human bidder
export const isLeadingBidder = (lotStanding) =>
  isExisty(lotStanding.leading_position)

export const isHighestBidder = (lotStanding) =>
  isLeadingBidder(lotStanding) &&
  lotStanding.sale_artwork.reserve_status !== "reserve_not_met"

export const LotStandingType = new GraphQLObjectType<any, ResolverContext>({
  name: "LotStanding",
  fields: () => ({
    active_bid: {
      type: BidderPosition.type,
      description: "Your bid if it is currently winning",
      resolve: (lotStanding) =>
        isHighestBidder(lotStanding) ? lotStanding.leading_position : null,
    },
    bidder: {
      type: Bidder.type,
    },
    is_highest_bidder: {
      type: GraphQLBoolean,
      description: "You are winning and reserve is met",
      resolve: isHighestBidder,
    },
    is_leading_bidder: {
      type: GraphQLBoolean,
      description: "You are the leading bidder without regard to reserve",
      resolve: isLeadingBidder,
    },
    most_recent_bid: {
      type: BidderPosition.type,
      description:
        "Your most recent bid—which is not necessarily winning (may be higher or lower)",
      resolve: ({ max_position }) => max_position,
    },
    sale: {
      type: Sale.type,
      resolve: ({ bidder }, _options, { saleLoader }) => {
        if (bidder.sale && bidder.sale.id) {
          // don't error if the sale is unpublished
          return saleLoader(bidder.sale.id).catch(() => null)
        }
        return null
      },
    },
    sale_artwork: {
      type: SaleArtwork.type,
    },
  }),
})

const LotStanding: GraphQLFieldConfig<void, ResolverContext> = {
  type: LotStandingType,
  description: "The current user's status relating to bids on artworks",
  args: {
    artwork_id: {
      type: GraphQLString,
    },
    sale_id: {
      type: GraphQLString,
    },
    sale_artwork_id: {
      type: GraphQLString,
    },
  },
  resolve: (
    _root,
    { sale_id, artwork_id, sale_artwork_id },
    { lotStandingLoader }
  ) => {
    if (!lotStandingLoader) return null
    return lotStandingLoader({ sale_id, artwork_id, sale_artwork_id }).then(
      ([lotStanding]) => {
        return lotStanding
      }
    )
  },
}

export default LotStanding
