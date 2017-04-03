import gravity from '../../lib/loaders/gravity';
import { CollectorProfileType } from './collector_profile';
import {
  GraphQLBoolean,
  GraphQLString,
} from 'graphql';

export default {
  type: CollectorProfileType,
  decription: 'Updating a collector profile (loyalty applicant status).',
  args: {
    loyalty_applicant: {
      type: GraphQLBoolean,
    },
    professional_buyer: {
      type: GraphQLBoolean,
    },
    self_reported_purchases: {
      type: GraphQLString,
    },
  },
  resolve: (root, {
    loyalty_applicant,
    professional_buyer,
    self_reported_purchases,
  }, request, { rootValue: { accessToken } }) => {
    if (!accessToken) return null;
    return gravity.with(accessToken, {
      method: 'PUT',
    })('me/collector_profile', { loyalty_applicant, professional_buyer, self_reported_purchases });
  },
};
