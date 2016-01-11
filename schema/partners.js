import gravity from '../lib/loaders/gravity';
import Partner from './partner';
import {
  GraphQLString,
  GraphQLList,
} from 'graphql';

const Partners = {
  type: new GraphQLList(Partner.type),
  description: 'A list of Partners',
  args: {
    near: {
      type: GraphQLString,
      description: 'Coordinates to find partners closest to',
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
