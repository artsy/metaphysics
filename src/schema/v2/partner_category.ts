import _ from "lodash"
import cached from "./fields/cached"
import PartnerCategoryTypeEnum from "./input_fields/partner_category_type"
import { SlugAndInternalIDFields } from "./object_identification"
import {
  GraphQLString,
  GraphQLObjectType,
  GraphQLNonNull,
  GraphQLFieldConfig,
  GraphQLBoolean,
} from "graphql"
import { ResolverContext } from "types/graphql"

export const PartnerCategoryType = new GraphQLObjectType<any, ResolverContext>({
  name: "PartnerCategory",
  fields: () => {
    const { Partners } = require("./partners")
    return {
      ...SlugAndInternalIDFields,
      cached,
      categoryType: PartnerCategoryTypeEnum,
      name: {
        type: GraphQLString,
      },
      internal: {
        type: GraphQLBoolean,
      },
      partners: {
        type: Partners.type,
        args: Partners.args,
        resolve: Partners.resolve
      },
    }
  },
})

const PartnerCategory: GraphQLFieldConfig<void, ResolverContext> = {
  type: PartnerCategoryType,
  description: "A PartnerCategory",
  args: {
    id: {
      type: new GraphQLNonNull(GraphQLString),
      description: "The slug or ID of the PartnerCategory",
    },
  },
  resolve: (_root, { id }, { partnerCategoryLoader }) =>
    partnerCategoryLoader(id),
}

export default PartnerCategory
