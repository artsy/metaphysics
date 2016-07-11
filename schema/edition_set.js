import { isEmpty } from 'lodash';
import { IDFields } from './object_identification';
import Dimensions from './dimensions';
import {
  GraphQLString,
  GraphQLBoolean,
  GraphQLObjectType,
} from 'graphql';

const EditionSetType = new GraphQLObjectType({
  name: 'EditionSet',
  fields: {
    ...IDFields,
    dimensions: Dimensions,
    edition_of: {
      type: GraphQLString,
      resolve: ({ editions }) => editions,
    },
    is_acquireable: {
      type: GraphQLBoolean,
      resolve: ({ acquireable }) => acquireable,
    },
    is_sold: {
      type: GraphQLBoolean,
      resolve: ({ sold }) => sold,
    },
    is_for_sale: {
      type: GraphQLBoolean,
      resolve: ({ forsale }) => forsale,
    },
    price: {
      type: GraphQLString,
      resolve: ({ price, forsale }) => {
        const fallback = forsale ? 'Available' : 'Not for Sale';
        return !isEmpty(price) ? price : fallback;
      },
    },
  },
});

export default {
  type: EditionSetType,
};
