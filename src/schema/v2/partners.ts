import { clone, pick } from "lodash"
import Partner, { PartnerType } from "./partner"
import PartnerTypeType from "./input_fields/partner_type_type"
import {
  GraphQLString,
  GraphQLList,
  GraphQLBoolean,
  GraphQLInt,
  GraphQLEnumType,
  GraphQLFieldConfig,
} from "graphql"
import { ResolverContext } from "types/graphql"
import { convertConnectionArgsToGravityArgs } from "lib/helpers"
import { pageable } from "relay-cursor-paging"
import {
  connectionWithCursorInfo,
  createPageCursors,
} from "./fields/pagination"
import { connectionFromArray } from "graphql-relay"

export const Partners: GraphQLFieldConfig<void, ResolverContext> = {
  type: new GraphQLList(Partner.type),
  description: "A list of Partners",
  args: {
    defaultProfilePublic: {
      type: GraphQLBoolean,
    },
    eligibleForCarousel: {
      type: GraphQLBoolean,
    },
    eligibleForListing: {
      type: GraphQLBoolean,
      description: "Indicates an active subscription",
    },
    eligibleForPrimaryBucket: {
      type: GraphQLBoolean,
      description: "Indicates tier 1/2 for gallery, 1 for institution",
    },
    eligibleForSecondaryBucket: {
      type: GraphQLBoolean,
      description: "Indicates tier 3/4 for gallery, 2 for institution",
    },
    ids: {
      type: new GraphQLList(GraphQLString),
    },
    hasFullProfile: {
      type: GraphQLBoolean,
    },
    near: {
      type: GraphQLString,
      description: "Coordinates to find partners closest to",
    },
    page: {
      type: GraphQLInt,
    },
    partnerCategories: {
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
  resolve: (
    _root,
    {
      defaultProfilePublic,
      eligibleForCarousel,
      eligibleForListing,
      eligibleForPrimaryBucket,
      eligibleForSecondaryBucket,
      hasFullProfile,
      partnerCategories,
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
      partner_categories: partnerCategories,
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
}

export const PartnersConnection: GraphQLFieldConfig<void, ResolverContext> = {
  type: connectionWithCursorInfo({ nodeType: PartnerType }).connectionType,
  description: "A list of Partners",
  args: pageable({
    ids: {
      type: new GraphQLList(GraphQLString),
    },
    ...pick(
      Partners.args,
      "near",
      "eligibleForListing",
      "defaultProfilePublic",
      "sort"
    ),
  }),
  resolve: (_root, options, { partnersLoader }) => {
    const { page, size } = convertConnectionArgsToGravityArgs(options)
    const gravityArgs: any = {
      id: options.ids,
      page,
      size,
      near: options.near,
      eligible_for_listing: options.eligibleForListing,
      default_profile_public: options.defaultProfilePublic,
      sort: options.sort,
    }

    return partnersLoader(gravityArgs).then((body) => {
      const totalCount = body.length
      return {
        totalCount,
        pageCursors: createPageCursors({ page, size }, totalCount),
        ...connectionFromArray(body, gravityArgs),
      }
    })
  },
}
