// @ts-check

import { IDFields } from "schema/object_identification"
import { GraphQLObjectType, GraphQLString, GraphQLInt } from "graphql"

export const AggregationCountType = new GraphQLObjectType({
  name: "AggregationCount",
  description: "One item in an aggregation",
  fields: {
    ...IDFields,
    count: {
      type: GraphQLInt,
    },
    name: {
      type: GraphQLString,
    },
    sortable_id: {
      type: GraphQLString,
    },
  },
})

export default {
  type: AggregationCountType,
  resolve: ({ name, count, sortable_id }, id) => ({
    id,
    sortable_id,
    name,
    count,
  }),
}
