import {
  GraphQLObjectType,
  GraphQLString,
  GraphQLInt,
} from 'graphql';

export const AggregationCountType = new GraphQLObjectType({
  name: 'AggregationCount',
  description: 'One item in an aggregation',
  fields: {
    id: {
      type: GraphQLString,
    },
    name: {
      type: GraphQLString,
    },
    count: {
      type: GraphQLInt,
    },
  },
});

export default {
  type: AggregationCountType,
  resolve: ({ name, count }, id) => ({ id, name, count }),
};
