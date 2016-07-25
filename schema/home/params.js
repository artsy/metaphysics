import {
  GraphQLObjectType,
  GraphQLID,
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
    id: {
      type: GraphQLID,
    },
    followed_artist_id: {
      type: GraphQLID,
    },
    related_artist_id: {
      type: GraphQLID,
    },
  },
});

export default {
  type: HomePageModuleParams,
  resolve: ({ params }) => params,
};
