import date from './fields/date';
import gravity from '../lib/loaders/gravity';
import Profile from './profile';
import BidderPosition from './bidder_position';
import {
  GraphQLString,
  GraphQLObjectType,
  GraphQLList,
  GraphQLBoolean,
} from 'graphql';
import _ from 'lodash';

const Me = new GraphQLObjectType({
  name: 'Me',
  fields: {
    id: {
      type: GraphQLString,
    },
    created_at: date,
    email: {
      type: GraphQLString,
    },
    profile: {
      type: Profile.type,
      resolve: ({ default_profile_id }) =>
        gravity(`profile/${default_profile_id}`),
    },
    bidder_positions: {
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
            )).then((saleArtworks) => {
              return Promise.all(_.map(saleArtworks, (saleArtwork) =>
                gravity(`sale/${saleArtwork.sale_id}`)
              )).then((sales) => {
                return _(sales).chain()
                  .filter((sale) => sale.auction_state === 'open')
                  .map((sale) => _.find(saleArtworks, { sale_id: sale.id }))
                  .map((sa) =>
                    _.find(latestPositions, { sale_artwork_id: sa._id })
                  )
                  .value();
              });
            });
          });
      },
    },
  },
});

export default {
  type: Me,
  resolve: (root, options, { rootValue: { accessToken } }) => {
    return gravity.with(accessToken)('me');
  },
};
