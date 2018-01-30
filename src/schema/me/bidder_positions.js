import _ from "lodash"
import BidderPosition from "schema/bidder_position"
import { GraphQLList, GraphQLBoolean, GraphQLString } from "graphql"

export default {
  type: new GraphQLList(BidderPosition.type),
  description: "A list of the current user's bidder positions",
  args: {
    artwork_id: {
      type: GraphQLString,
      description: "Only the bidder positions on a specific artwork",
    },
    current: {
      type: GraphQLBoolean,
      description: "Only the most recent bidder positions per artwork.",
    },
    sale_id: {
      type: GraphQLString,
      description: "Only the bidder positions for a specific auction",
    },
  },
  resolve: (
    root,
    { current, artwork_id, sale_id },
    request,
    {
      rootValue: { meBidderPositionsLoader, saleLoader, saleArtworkRootLoader },
    }
  ) => {
    return meBidderPositionsLoader({
      artwork_id,
      sale_id,
      sort: "-created_at",
    }).then(positions => {
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
        .reject({ highest_bid: null })
        .uniqBy("sale_artwork_id")
        .value()
      //
      // 2. Find only bidder positions in "open" auctions. This requires
      // fetching all of that related data to be able to do:
      // `bidder_position.sale_artwork.sale.auction_state != open`
      //
      return Promise.all(
        _.map(latestPositions, position =>
          saleArtworkRootLoader(position.sale_artwork_id)
            // For unpublished artworks
            .catch(() => null)
        )
      ).then(saleArtworks => {
        return Promise.all(
          _.map(_.compact(saleArtworks), saleArtwork =>
            saleLoader(saleArtwork.sale_id)
          )
        ).then(sales => {
          return _.filter(latestPositions, position => {
            const saleArtwork = _.find(saleArtworks, {
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
