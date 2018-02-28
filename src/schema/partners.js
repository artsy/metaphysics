import { clone } from "lodash"
import Partner from "./partner"
import PartnerTypeType from "./input_fields/partner_type_type"
import {
  GraphQLString,
  GraphQLList,
  GraphQLBoolean,
  GraphQLInt,
  GraphQLEnumType,
} from "graphql"

const Partners = {
  type: new GraphQLList(Partner.type),
  description: "A list of Partners",
  args: {
    default_profile_public: {
      type: GraphQLBoolean,
    },
    eligible_for_carousel: {
      type: GraphQLBoolean,
    },
    eligible_for_listing: {
      type: GraphQLBoolean,
      description: "Indicates an active subscription",
    },
    eligible_for_primary_bucket: {
      type: GraphQLBoolean,
      description: "Indicates tier 1/2 for gallery, 1 for institution",
    },
    eligible_for_secondary_bucket: {
      type: GraphQLBoolean,
      description: "Indicates tier 3/4 for gallery, 2 for institution",
    },
    ids: {
      type: new GraphQLList(GraphQLString),
    },
    has_full_profile: {
      type: GraphQLBoolean,
    },
    near: {
      type: GraphQLString,
      description: "Coordinates to find partners closest to",
    },
    page: {
      type: GraphQLInt,
    },
    partner_categories: {
      type: new GraphQLList(GraphQLString),
      description: `
        Only return partners of the specified partner categories.
        Accepts list of slugs.
      `,
    },
    size: {
      type: GraphQLInt,
    },
    sort: {
      type: new GraphQLEnumType({
        name: "PartnersSortType",
        values: {
          CREATED_AT_ASC: {
            value: "created_at",
          },
          CREATED_AT_DESC: {
            value: "-created_at",
          },
          SORTABLE_ID_ASC: {
            value: "sortable_id",
          },
          SORTABLE_ID_DESC: {
            value: "-sortable_id",
          },
          RELATIVE_SIZE_ASC: {
            value: "relative_size",
          },
          RELATIVE_SIZE_DESC: {
            value: "-relative_size",
          },
          PUBLISHED_AT_DESC: {
            value: "-published_at",
          },
          RANDOM_SCORE_DESC: {
            value: "-random_score",
          },
        },
      }),
    },
    term: {
      type: GraphQLString,
      description: "term used for searching Partners",
    },
    type: {
      type: new GraphQLList(PartnerTypeType),
    },
  },
  resolve: (root, options, request, { rootValue: { partnersLoader } }) => {
    const cleanedOptions = clone(options)
    // make ids singular to match gravity :id
    if (options.ids) {
      cleanedOptions.id = options.ids
      delete cleanedOptions.ids
    }
    return partnersLoader(cleanedOptions)
  },
}

export default Partners
