import date from '../fields/date';
import impulse from '../../lib/loaders/impulse';
import gravity from '../../lib/loaders/gravity';
import {
  GraphQLObjectType,
  GraphQLString,
  GraphQLList,
  GraphQLInt,
} from 'graphql';
const { IMPULSE_APPLICATION_ID } = process.env;

const ConversationType = new GraphQLObjectType({
  name: 'ConversationType',
  description: 'A conversation.',
  fields: {
    id: {
      description: 'Impulse id.',
      type: GraphQLString,
    },
    inquiry_id: {
      description: 'Gravity inquiry id.',
      type: GraphQLString,
    },
    from_id: {
      type: GraphQLString,
    },
    from_type: {
      type: GraphQLString,
    },
    from_email: {
      type: GraphQLString,
    },
    to_id: {
      type: GraphQLString,
    },
    to_type: {
      type: GraphQLString,
    },
    buyer_outcome: {
      type: GraphQLString,
    },
    buyer_outcome_at: date,
    initial_message: {
      type: GraphQLString,
    },
  },
});

export default {
  type: new GraphQLList(ConversationType),
  decription: 'Converations for the user. First a token from gravity is requested.',
  args: {
    page: {
      type: GraphQLInt,
    },
    size: {
      type: GraphQLInt,
    },
  },
  resolve: (root, option, request, { rootValue: { accessToken, userID } }) => {
    if (!accessToken) return null;
    return gravity.authenticatedPost(accessToken)('me/token', { client_application_id: IMPULSE_APPLICATION_ID }).then(data => {
      return impulse.with(data.token)('conversations', { from_id: userID, from_type: 'User' }).then(impulseData => {
        return impulseData.conversations;
      });
    });
  }
}
