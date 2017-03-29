import date from '../fields/date';
import impulse from '../../lib/loaders/impulse';
import gravity from '../../lib/loaders/gravity';
import {
  GraphQLObjectType,
  GraphQLString,
  GraphQLList,
  GraphQLInt,
  GraphQLBoolean,
  GraphQLNonNull,
} from 'graphql';
const { IMPULSE_APPLICATION_ID } = process.env;

export const ConversationType = new GraphQLObjectType({
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
      type: new GraphQLNonNull(GraphQLString),
    },
    from_type: {
      type: new GraphQLNonNull(GraphQLString),
    },
    from_name: {
      type: new GraphQLNonNull(GraphQLString),
    },
    from_email: {
      type: new GraphQLNonNull(GraphQLString),
    },
    to_id: {
      type: new GraphQLNonNull(GraphQLString),
    },
    to_type: {
      type: new GraphQLNonNull(GraphQLString),
    },
    to_name: {
      type: new GraphQLNonNull(GraphQLString),
    },
    buyer_outcome: {
      type: GraphQLString,
    },
    buyer_outcome_at: date,
    created_at: date,

    initial_message: {
      type: GraphQLString,
    },
    purchase_request: {
      type: GraphQLBoolean,
    },
  },
});

export default {
  type: new GraphQLList(ConversationType),
  decription: 'Conversations, usually between a user and partner.',
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
    return gravity.with(accessToken, { method: 'POST' })('me/token', {
      client_application_id: IMPULSE_APPLICATION_ID,
    }).then(data => {
      return impulse.with(data.token)('conversations', {
        from_id: userID,
        from_type: 'User',
      }).then(impulseData => {
        return impulseData.conversations;
      });
    });
  },
};
