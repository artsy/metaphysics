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

export const parseCounts = (obj) =>
  Object.keys(obj.counts).map(function (key) {
    const count = obj.counts[key];
    count.id = key;
    return count;
  });
