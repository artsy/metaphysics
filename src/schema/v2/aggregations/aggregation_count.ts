import { IDFields } from "schema/v2/object_identification"
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
      sortableID: {
        type: GraphQLString,
        resolve: ({ sortable_id }) => sortable_id,
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
