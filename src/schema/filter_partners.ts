import _ from "lodash"
import Partners from "./partners"
import {
  FilterPartnersType,
  PartnersAggregation,
} from "./aggregations/filter_partners_aggregation"
import { GraphQLList, GraphQLNonNull, GraphQLFieldConfig } from "graphql"
import { ResolverContext } from "types/graphql"

const FilterPartners: GraphQLFieldConfig<void, ResolverContext> = {
  type: FilterPartnersType,
  description: "Partners Elastic Search results",
  args: _.assign({}, Partners.args, {
    aggregations: {
      type: new GraphQLNonNull(new GraphQLList(PartnersAggregation)),
    },
  }),
  resolve: (_root, options, { partnersLoader }) => partnersLoader(options),
}

export default FilterPartners
