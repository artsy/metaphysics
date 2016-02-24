import _ from 'lodash';
import gravity from '../../lib/loaders/gravity';
import BidderPosition from '../bidder_position';
import {
  GraphQLList,
  GraphQLBoolean,
} from 'graphql';

export default {
  type: new GraphQLList(BidderPosition.type),
  description: "A list of the current user's bidder positions",
  args: {
    current: {
      type: GraphQLBoolean,
      description: 'Only the most recent bidder positions per artwork.',
    },
  },
  resolve: (root, { current }, { rootValue: { accessToken } }) => {
    return gravity.with(accessToken)('me/bidder_positions')
      .then((positions) => {
        if (!current) return positions;

        // When asking for "my current bids" we need to...
        //
        // 1. Find only positions that are "last placed" and
        // "competing to win" for that user, which means finding the most
        // recently created bidder positions per sale artwork where
        // `position.highest_bid != null`.
        //
        const latestPositions = _(positions).chain()
          .reject({ highest_bid: null })
          .uniqBy('sale_artwork_id')
          .value();
        //
        // 2. Find only bidder positions in "open" auctions. This requires
        // fetching all of that related data to be able to do:
        // `bidder_position.sale_artwork.sale.auction_state != open`
        //
        return Promise.all(_.map(latestPositions, (position) =>
          gravity(`sale_artwork/${position.sale_artwork_id}`)
            // For unpublished artworks
            .catch(() => null)
        )).then((saleArtworks) => {
          return Promise.all(_.map(_.compact(saleArtworks), (saleArtwork) =>
            gravity(`sale/${saleArtwork.sale_id}`)
          )).then((sales) => {
            return _.filter(latestPositions, (position) => {
              const saleArtwork = _.find(saleArtworks, {
                _id: position.sale_artwork_id,
              });
              if (!saleArtwork) return false;
              const sale = _.find(sales, { id: saleArtwork.sale_id });
              if (!sale) return false;
              return sale.auction_state === 'open';
            });
          });
        });
      });
  },
};
