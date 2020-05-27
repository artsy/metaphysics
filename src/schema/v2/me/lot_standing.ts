import { isExisty } from "lib/helpers"
import BidderPosition from "schema/v2/bidder_position"
import Bidder from "schema/v2/bidder"
import Sale from "schema/v2/sale"
import SaleArtwork from "schema/v2/sale_artwork"
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
    activeBid: {
      type: BidderPosition.type,
      description: "Your bid if it is currently winning",
      resolve: (lotStanding) =>
        isHighestBidder(lotStanding) ? lotStanding.leading_position : null,
    },
    bidder: {
      type: Bidder.type,
    },
    isHighestBidder: {
      type: GraphQLBoolean,
      description: "You are winning and reserve is met",
      resolve: isHighestBidder,
    },
    isLeadingBidder: {
      type: GraphQLBoolean,
      description: "You are the leading bidder without regard to reserve",
      resolve: isLeadingBidder,
    },
    mostRecentBid: {
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
    saleArtwork: {
      type: SaleArtwork.type,
      resolve: ({ sale_artwork }) => sale_artwork,
    },
  }),
})

const LotStanding: GraphQLFieldConfig<void, ResolverContext> = {
  type: LotStandingType,
  description: "The current user's status relating to bids on artworks",
  args: {
    artworkID: {
      type: GraphQLString,
    },
    saleID: {
      type: GraphQLString,
    },
    saleArtworkID: {
      type: GraphQLString,
    },
  },
  resolve: (
    _root,
    { saleID: sale_id, artworkID: artwork_id, saleArtworkID: sale_artwork_id },
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
