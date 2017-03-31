import gravity from '../../lib/loaders/gravity';
import { CollectorProfileType } from './collector_profile';
import {
  GraphQLBoolean,
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
  },
  resolve: (root, {
    loyalty_applicant,
    professional_buyer,
  }, request, { rootValue: { accessToken } }) => {
    if (!accessToken) return null;
    return gravity.with(accessToken, {
      method: 'PUT',
    })('me/collector_profile', { loyalty_applicant, professional_buyer });
  },
};
