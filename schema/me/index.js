import date from '../fields/date';
import gravity from '../../lib/loaders/gravity';
import Bidders from './bidders';
import BidderStatus from './bidder_status';
import BidderPositions from './bidder_positions';
import LotStanding from './lot_standing';
import LotStandings from './lot_standings';
import SaleRegistrations from './sale_registrations';
import SuggestedArtists from './suggested_artists';
import FollowArtists from './follow_artists';
import Notifications from './notifications';
import ArtworkInquiries from './artwork_inquiries';
import { IDFields } from '../object_identification';
import {
  GraphQLString,
  GraphQLObjectType,
} from 'graphql';

const Me = new GraphQLObjectType({
  name: 'Me',
  fields: {
    ...IDFields,
    type: {
      type: GraphQLString,
    },
    created_at: date,
    email: {
      type: GraphQLString,
    },
    name: {
      type: GraphQLString,
    },
    paddle_number: {
      type: GraphQLString,
    },
    bidders: Bidders,
    bidder_status: BidderStatus,
    bidder_positions: BidderPositions,
    lot_standing: LotStanding,
    lot_standings: LotStandings,
    sale_registrations: SaleRegistrations,
    follow_artists: FollowArtists,
    suggested_artists: SuggestedArtists,
    notifications_connection: Notifications,
    artwork_inquiries_connection: ArtworkInquiries,
  },
});

export default {
  type: Me,
  resolve: (root, options, request, { rootValue: { accessToken } }) => {
    if (!accessToken) return null;
    return gravity.with(accessToken)('me')
      .catch(() => null);
  },
};
