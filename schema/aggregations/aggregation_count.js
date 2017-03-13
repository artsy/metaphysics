// @flow
import type { GraphQLFieldConfig } from 'graphql';

import { IDFields } from '../object_identification';
import {
  GraphQLObjectType,
  GraphQLString,
  GraphQLInt,
} from 'graphql';

export const AggregationCountType = new GraphQLObjectType({
  name: 'AggregationCount',
  description: 'One item in an aggregation',
  fields: {
    ...IDFields,
    count: {
      type: GraphQLInt,
    },
    name: {
      type: GraphQLString,
    },
  },
});

export default ({
  type: AggregationCountType,
  resolve: ({ name, count }, id) => ({ id, name, count }),
}: GraphQLFieldConfig<AggregationCountType, any>);
