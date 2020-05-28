import _ from "lodash"
import BidderPosition from "schema/v2/bidder_position"
import {
  GraphQLList,
  GraphQLBoolean,
  GraphQLString,
  GraphQLFieldConfig,
} from "graphql"
import { ResolverContext } from "types/graphql"

const BidderPositions: GraphQLFieldConfig<void, ResolverContext> = {
  type: new GraphQLList(BidderPosition.type),
  description: "A list of the current user's bidder positions",
  args: {
    artworkID: {
      type: GraphQLString,
      description: "Only the bidder positions on a specific artwork",
    },
    current: {
      type: GraphQLBoolean,
      description: "Only the most recent bidder positions per artwork.",
    },
    saleID: {
      type: GraphQLString,
      description: "Only the bidder positions for a specific auction",
    },
  },
  resolve: (
    _root,
    { current, artworkID: artwork_id, saleID: sale_id },
    { meBidderPositionsLoader, saleLoader, saleArtworkRootLoader }
  ) => {
    if (!meBidderPositionsLoader) return null
    return meBidderPositionsLoader({
      artwork_id,
      sale_id,
      sort: "-created_at",
    }).then((positions) => {
      if (!current || artwork_id) return positions
      // When asking for "my current bids" we need to...
      //
      // 1. Find only positions that are "last placed" and
      // "competing to win" for that user, which means finding the most
      // recently created bidder positions per sale artwork where
      // `position.highest_bid != null`.
      //
      const latestPositions = _(positions)
        .chain()
        .reject({ highest_bid: null } as any)
        .uniqBy("sale_artwork_id")
        .value()
      //
      // 2. Find only bidder positions in "open" auctions. This requires
      // fetching all of that related data to be able to do:
      // `bidder_position.sale_artwork.sale.auction_state != open`
      //
      return Promise.all(
        _.map(latestPositions, (position) =>
          // FIXME: Property 'sale_artwork_id' does not exist on type 'string'.
          // @ts-ignore
          saleArtworkRootLoader(position.sale_artwork_id)
            // For unpublished artworks
            .catch(() => null)
        )
      ).then((saleArtworks) => {
        return Promise.all(
          _.map(_.compact(saleArtworks), (saleArtwork) =>
            saleLoader(saleArtwork.sale_id)
          )
        ).then((sales) => {
          return _.filter(latestPositions, (position) => {
            const saleArtwork = _.find(saleArtworks, {
              // FIXME: Property 'sale_artwork_id' does not exist on type 'string'.
              // @ts-ignore
              _id: position.sale_artwork_id,
            })
            if (!saleArtwork) return false
            const sale = _.find(sales, { id: saleArtwork.sale_id })
            if (!sale) return false
            return sale.auction_state === "open"
          })
        })
      })
    })
  },
}

export default BidderPositions
