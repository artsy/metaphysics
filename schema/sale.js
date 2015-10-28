import _ from 'lodash';
import artsy from '../lib/artsy';
import {
  GraphQLString,
  GraphQLNonNull,
} from 'graphql';

let SaleType = new GraphQLObjectType({
  name: 'Sale',
  fields: () => ({
    id: {
      type: GraphQLString
    },
    name: {
      type: GraphQLString
    },
    description: {
      type: GraphQLString
    },
    sale_type: {
      type: GraphQLString
    }
  })
});

let Sale = {
  type: SaleType,
  description: 'A Sale',
  args: {
    id: {
      type: new GraphQLNonNull(GraphQLString),
      description: 'The slug or ID of the Sale'
    }
  },
  resolve: (root, { id }) => artsy(`sale/${id}`)
};

export default Sale;
