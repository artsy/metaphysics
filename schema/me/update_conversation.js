import impulse from '../../lib/loaders/impulse';
import gravity from '../../lib/loaders/gravity';
import { ConversationType } from './conversations';
import {
  GraphQLString,
  GraphQLNonNull,
} from 'graphql';
const { IMPULSE_APPLICATION_ID } = process.env;

export default {
  type: ConversationType,
  decription: 'Updating buyer outcome of a conversation.',
  args: {
    buyer_outcome: {
      type: new GraphQLNonNull(GraphQLString),
    },
    id: {
      type: new GraphQLNonNull(GraphQLString),
    },
  },
  resolve: (root, { buyer_outcome, id }, request, { rootValue: { accessToken } }) => {
    if (!accessToken) return null;
    return gravity.authenticatedPost(accessToken)('me/token', {
      client_application_id: IMPULSE_APPLICATION_ID,
    }).then(data => {
      return impulse.with(data.token, { method: 'PUT' })(`conversations/${id}`, { buyer_outcome })
        .then(impulseData => {
          return impulseData;
        });
    });
  },
};
