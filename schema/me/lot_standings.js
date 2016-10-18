import gravity from '../../lib/loaders/gravity';
import LotStanding from './lot_standing';
import {
  GraphQLList,
  GraphQLBoolean,
  GraphQLString,
} from 'graphql';

export default {
  type: new GraphQLList(LotStanding.type),
  description: "A list of the current user's auction standings for given lots",
  args: {
    live: {
      type: GraphQLBoolean,
      description: 'Only the lot standings for currently open or closed auctions.',
    },
    active_positions: {
      type: GraphQLBoolean,
      description: 'Only includes lots on which you have a leading bidder position.',
    },
    artwork_id: {
      type: GraphQLString,
      description: 'Only the lot standings on a specific artwork',
    },
    sale_id: {
      type: GraphQLString,
      description: 'Only the lot standings for a specific auction',
    },
  },
  resolve: (root, {
    live,
    active_positions,
    artwork_id,
    sale_id,
  }, request, { rootValue: { accessToken } }) => {
    return gravity
      .with(accessToken)('me/lot_standings', {
        live,
        active_positions,
        artwork_id,
        sale_id,
      })
      .then((lotStandings) => {
        return lotStandings;
      });
  },
};
