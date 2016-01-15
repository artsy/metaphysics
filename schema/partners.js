import gravity from '../lib/loaders/gravity';
import Partner from './partner';
import {
  GraphQLString,
  GraphQLList,
  GraphQLBoolean,
} from 'graphql';

const Partners = {
  type: new GraphQLList(Partner.type),
  description: 'A list of Partners',
  args: {
    near: {
      type: GraphQLString,
      description: 'Coordinates to find partners closest to',
    },
    eligible_for_primary_bucket: {
      type: GraphQLBoolean,
      description: 'Indicates tier 1/2 for gallery, 1 for institution',
    },
    eligible_for_secondary_bucket: {
      type: GraphQLBoolean,
      description: 'Indicates tier 3/4 for gallery, 2 for institution',
    },
    has_full_profile: {
      type: GraphQLBoolean,
    },
    default_profile_public: {
      type: GraphQLBoolean,
    },
    partner_categories: {
      type: new GraphQLList(GraphQLString),
      description: `
        Only return partners of the specified partner categories.
        Accepts list of slugs.
      `,
    },
    type: {
      type: new GraphQLList(GraphQLString),
      description: 'Only return partners of the specified _type(s).',
    },
  },
  resolve: (root, options) => gravity('partners', options),
};

export default Partners;
