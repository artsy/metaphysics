import { PartnerCategoryType } from "./partner_category"
import { PartnerCategoryTypeEnum } from "./input_fields/category_type"

import {
  GraphQLList,
  GraphQLInt,
  GraphQLBoolean,
  GraphQLFieldConfig,
} from "graphql"
import { ResolverContext } from "types/graphql"

const PartnerCategories: GraphQLFieldConfig<void, ResolverContext> = {
  type: new GraphQLList(PartnerCategoryType),
  description: "A list of PartnerCategories",
  args: {
    category_type: PartnerCategoryTypeEnum,
    internal: {
      type: GraphQLBoolean,
      defaultValue: false,
      description: "Filter by whether the partner category is internal",
    },
    size: {
      type: GraphQLInt,
    },
  },
  resolve: (_root, options, { partnerCategoriesLoader }) =>
    partnerCategoriesLoader(options),
}

export default PartnerCategories
