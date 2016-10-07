import galaxy from '../lib/loaders/galaxy';
import { IDFields } from './object_identification';

import {
  GraphQLString,
  GraphQLObjectType,
  GraphQLNonNull,
} from 'graphql';

const ExternalPartnerType = new GraphQLObjectType({
  name: 'ExternalPartner',
  fields: () => {
    return {
      ...IDFields,
      name: {
        type: GraphQLString,
        resolve: ({ name }) => name.trim(),
      },
      city: {
        type: GraphQLString,
        resolve: ({ city }) => city,
      },
    };
  },
});

const ExternalPartner = {
  type: ExternalPartnerType,
  description: 'An External Partner not on the platform',
  args: {
    id: {
      type: new GraphQLNonNull(GraphQLString),
      description: 'The ID of the Partner',
    },
  },
  resolve: (id) => galaxy(`galleries/${id}`),
};

export default ExternalPartner;
