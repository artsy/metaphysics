import { isEmpty } from 'lodash';
import {
  GraphQLString,
  GraphQLBoolean,
  GraphQLObjectType,
} from 'graphql';
import Dimensions from './dimensions';

const EditionSetType = new GraphQLObjectType({
  name: 'EditionSet',
  fields: {
    id: {
      type: GraphQLString,
    },
    dimensions: Dimensions,
    edition_of: {
      type: GraphQLString,
      resolve: ({ editions }) => editions,
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
