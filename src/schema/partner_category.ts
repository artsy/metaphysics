import _ from "lodash"
import cached from "./fields/cached"
import Partners from "./partners"
import CategoryType from "./input_fields/category_type"
import { IDFields } from "./object_identification"
import { GraphQLString, GraphQLObjectType, GraphQLNonNull } from "graphql"

const PartnerCategoryType = new GraphQLObjectType<ResolverContext>({
  name: "PartnerCategory",
  fields: () => ({
    ...IDFields,
    cached,
    category_type: CategoryType,
    name: {
      type: GraphQLString,
    },
    partners: {
      type: Partners.type,
      args: Partners.args,
      resolve: ({ id }, options, _request, { rootValue: { partnersLoader } }) =>
        partnersLoader(
          _.defaults(options, {
            partner_categories: [id],
          })
        ),
    },
  }),
})

const PartnerCategory = {
  type: PartnerCategoryType,
  description: "A PartnerCategory",
  args: {
    id: {
      type: new GraphQLNonNull(GraphQLString),
      description: "The slug or ID of the PartnerCategory",
    },
  },
  resolve: (
    _root,
    { id },
    _request,
    { rootValue: { partnerCategoryLoader } }
  ) => partnerCategoryLoader(id),
}

export default PartnerCategory
