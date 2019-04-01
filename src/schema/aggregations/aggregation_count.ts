import { IDFields } from "schema/object_identification"
import {
  GraphQLObjectType,
  GraphQLString,
  GraphQLInt,
  GraphQLFieldConfig,
} from "graphql"
import { ResolverContext } from "types/graphql"

export const AggregationCountType = new GraphQLObjectType<any, ResolverContext>(
  {
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
  }
)

const AggregationCount: GraphQLFieldConfig<
  { name: string; count: number; sortable_id: string },
  ResolverContext
> = {
  type: AggregationCountType,
  resolve: ({ name, count, sortable_id }, id) => ({
    id,
    sortable_id,
    name,
    count,
  }),
}

export default AggregationCount
