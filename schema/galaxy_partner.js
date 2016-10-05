import galaxy from '../lib/loaders/galaxy';
import { IDFields } from './object_identification';

import {
  GraphQLString,
  GraphQLObjectType,
  GraphQLNonNull,
} from 'graphql';

const GalaxyPartnerType = new GraphQLObjectType({
  name: 'GalaxyPartner',
  fields: () => {
    return {
      ...IDFields,
      name: {
        type: GraphQLString,
        resolve: ({ name }) => name.trim(),
      },
    };
  },
});

const GalaxyPartner = {
  type: GalaxyPartnerType,
  description: 'A Galaxy Partner',
  args: {
    id: {
      type: new GraphQLNonNull(GraphQLString),
      description: 'The ID of the Partner',
    },
  },
  resolve: (id) => galaxy(`galleries/${id}`),
};

export default GalaxyPartner;
