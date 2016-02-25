import gravity from '../lib/loaders/gravity';
import PartnerCategory from './partner_category';
import CategoryType from './input_fields/category_type';

import {
  GraphQLList,
  GraphQLInt,
  GraphQLBoolean,
} from 'graphql';

const PartnerCategories = {
  type: new GraphQLList(PartnerCategory.type),
  description: 'A list of PartnerCategories',
  args: {
    size: {
      type: GraphQLInt,
    },
    category_type: CategoryType,
    internal: {
      type: GraphQLBoolean,
      defaultValue: false,
      description: 'Filter by whether category is internal',
    },
  },
  resolve: (root, options) => gravity('partner_categories', options),
};

export default PartnerCategories;
