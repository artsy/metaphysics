import _ from "lodash"
import Partners from "./partners"
import {
  FilterPartnersType,
  PartnersAggregation,
} from "./aggregations/filter_partners_aggregation"
import { GraphQLList, GraphQLNonNull } from "graphql"

const FilterPartners = {
  type: FilterPartnersType,
  description: "Partners Elastic Search results",
  args: _.assign({}, Partners.args, {
    aggregations: {
      type: new GraphQLNonNull(new GraphQLList(PartnersAggregation)),
    },
  }),
  resolve: (root, options, request, { rootValue: { partnersLoader } }) =>
    partnersLoader(options),
}

export default FilterPartners
