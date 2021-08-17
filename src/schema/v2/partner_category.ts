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
import { clone } from "lodash"

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
        resolve: (
          { id },
          {
            defaultProfilePublic,
            eligibleForCarousel,
            eligibleForListing,
            eligibleForPrimaryBucket,
            eligibleForSecondaryBucket,
            hasFullProfile,
            ..._options
          },
          { partnersLoader }
        ) => {
          const options: any = {
            default_profile_public: defaultProfilePublic,
            eligible_for_carousel: eligibleForCarousel,
            eligible_for_listing: eligibleForListing,
            eligible_for_primary_bucket: eligibleForPrimaryBucket,
            eligible_for_secondary_bucket: eligibleForSecondaryBucket,
            has_full_profile: hasFullProfile,
            partner_categories: [id],
            ..._options,
          }
          const cleanedOptions = clone(options)
          // make ids singular to match gravity :id
          if (options.ids) {
            cleanedOptions.id = options.ids
            delete cleanedOptions.ids
          }
          return partnersLoader(cleanedOptions)
        },
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
