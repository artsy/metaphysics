import {
  GraphQLObjectType,
  GraphQLString,
} from 'graphql';

const HomePageModuleParams = new GraphQLObjectType({
  name: 'HomePageModulesParams',
  fields: {
    gene_id: {
      type: GraphQLString,
    },
    medium: {
      type: GraphQLString,
    },
    price_range: {
      type: GraphQLString,
    },
  },
});

export default {
  type: HomePageModuleParams,
  resolve: ({ params }) => params,
};
