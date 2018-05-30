import PartnerCategory from "./partner_category"
import CategoryType from "./input_fields/category_type"

import { GraphQLList, GraphQLInt, GraphQLBoolean } from "graphql"

const PartnerCategories = {
  type: new GraphQLList(PartnerCategory.type),
  description: "A list of PartnerCategories",
  args: {
    category_type: CategoryType,
    internal: {
      type: GraphQLBoolean,
      defaultValue: false,
      description: "Filter by whether category is internal",
    },
    size: {
      type: GraphQLInt,
    },
  },
  resolve: (
    root,
    options,
    request,
    { rootValue: { partnerCategoriesLoader } }
  ) => partnerCategoriesLoader(options),
}

export default PartnerCategories
