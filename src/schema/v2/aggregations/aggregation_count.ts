import {
  GraphQLObjectType,
  GraphQLString,
  GraphQLInt,
  GraphQLFieldConfig,
  GraphQLNonNull,
} from "graphql"
import { ResolverContext } from "types/graphql"

export const AggregationCountType = new GraphQLObjectType<any, ResolverContext>(
  {
    name: "AggregationCount",
    description: "One item in an aggregation",
    fields: {
      value: {
        type: new GraphQLNonNull(GraphQLString),
      },
      count: {
        type: new GraphQLNonNull(GraphQLInt),
      },
      name: {
        type: new GraphQLNonNull(GraphQLString),
      },
      // sortableID: {
      //   type: GraphQLString,
      //   description: "If present, the preferred key to sort aggregations by.",
      //   resolve: ({ sortable_id }) => sortable_id,
      // },
    },
  }
)

const AggregationCount: GraphQLFieldConfig<
  { name: string; count: number; sortable_id: string },
  ResolverContext
> = {
  type: AggregationCountType,
  // This field config is never used as is, all call-sites use the `type` and
  // `resolve` fields separately. Importantly, the call-site is responsible for
  // providing the `key` of the aggregation as the second `value` argument.
  //
  // FIXME: This is not intuitive, as the second parameter of a `resolve`
  //        function is normally an object of `arguments`. We should probably
  //        simply *not* provide this function at all.
  resolve: ({ name, count, sortable_id }, value) => ({
    value,
    sortable_id,
    name,
    count,
  }),
}

export default AggregationCount
