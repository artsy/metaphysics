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
import Conversations from './conversations';
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
    artwork_inquiries_connection: ArtworkInquiries,
    bidders: Bidders,
    bidder_status: BidderStatus,
    bidder_positions: BidderPositions,
    conversations: Conversations,
    created_at: date,
    email: {
      type: GraphQLString,
    },
    follow_artists: FollowArtists,
    lot_standing: LotStanding,
    lot_standings: LotStandings,
    name: {
      type: GraphQLString,
    },
    notifications_connection: Notifications,
    paddle_number: {
      type: GraphQLString,
    },
    sale_registrations: SaleRegistrations,
    suggested_artists: SuggestedArtists,
    type: {
      type: GraphQLString,
    },
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
