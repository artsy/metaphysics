import gravity from '../lib/loaders/gravity';
import {
  GraphQLString,
  GraphQLObjectType,
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
  resolve: (root, { id }) => gravity(`sale/${id}`)
};

export default Sale;
