import _ from "lodash"
import cached from "./fields/cached"
import Partners from "./partners"
import { PartnerCategoryTypeEnum } from "./input_fields/category_type"
import { SlugAndInternalIDFields } from "./object_identification"
import {
  GraphQLString,
  GraphQLObjectType,
  GraphQLNonNull,
  GraphQLFieldConfig,
} from "graphql"
import { ResolverContext } from "types/graphql"

export const PartnerCategoryType = new GraphQLObjectType<any, ResolverContext>({
  name: "PartnerCategory",
  fields: () => ({
    ...SlugAndInternalIDFields,
    cached,
    category_type: PartnerCategoryTypeEnum,
    name: {
      type: GraphQLString,
    },
    partners: {
      type: Partners.type,
      args: Partners.args,
      resolve: ({ id }, options, { partnersLoader }) =>
        partnersLoader(
          _.defaults(options, {
            partner_categories: [id],
          })
        ),
    },
  }),
})

export const PartnerCategory: GraphQLFieldConfig<void, ResolverContext> = {
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
