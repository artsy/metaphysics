import gravity from '../lib/loaders/gravity';
import PartnerCategory from './partner_category';
import {
  GraphQLString,
  GraphQLList,
  GraphQLInt,
} from 'graphql';

const PartnerCategories = {
  type: new GraphQLList(PartnerCategory.type),
  description: 'A list of PartnerCategories',
  args: {
    size: {
      type: GraphQLInt,
    },
    category_type: {
      type: GraphQLString,
    },
  },
  resolve: (root, options) => gravity('partner_categories', options),
};

export default PartnerCategories;
