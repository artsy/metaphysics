import {
  GraphQLBoolean,
  GraphQLEnumType,
  GraphQLFieldConfig,
  GraphQLInt,
  GraphQLList,
  GraphQLString,
} from "graphql"
import { connectionFromArraySlice } from "graphql-relay"
import { convertConnectionArgsToGravityArgs } from "lib/helpers"
import { getLocationArgs } from "lib/locationHelpers"
import { clone, identity, pick, pickBy } from "lodash"
import { pageable } from "relay-cursor-paging"
import {
  connectionWithCursorInfo,
  createPageCursors,
} from "schema/v2/fields/pagination"
import PartnerTypeType from "schema/v2/input_fields/partner_type_type"
import Partner, { PartnerType } from "schema/v2/partner/partner"
import { ResolverContext } from "types/graphql"

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
    excludeFollowedPartners: {
      type: GraphQLBoolean,
      description:
        "Exclude partners the user follows (only effective when `include_partners_with_followed_artists` is set to true).",
    },
    ids: {
      type: new GraphQLList(GraphQLString),
    },
    includePartnersWithFollowedArtists: {
      type: GraphQLBoolean,
      description:
        "If true, will only return partners that list artists that the user follows",
    },
    ip: {
      type: GraphQLString,
      description: "An IP address, will be used to lookup location",
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
          DISTANCE: {
            value: "distance",
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
  resolve: async (
    _root,
    {
      defaultProfilePublic,
      eligibleForCarousel,
      eligibleForListing,
      eligibleForPrimaryBucket,
      eligibleForSecondaryBucket,
      ip,
      excludeFollowedPartners,
      hasFullProfile,
      includePartnersWithFollowedArtists,
      near,
      partnerCategories,
      ..._options
    },
    { partnersLoader, requestLocationLoader }
  ) => {
    if (ip && near) {
      throw new Error('The "ip" and "near" arguments are mutually exclusive.')
    }

    const locationArgs = await getLocationArgs(near, ip, requestLocationLoader)

    const options: any = {
      default_profile_public: defaultProfilePublic,
      eligible_for_carousel: eligibleForCarousel,
      eligible_for_listing: eligibleForListing,
      eligible_for_primary_bucket: eligibleForPrimaryBucket,
      eligible_for_secondary_bucket: eligibleForSecondaryBucket,
      exclude_followed_partners: excludeFollowedPartners,
      has_full_profile: hasFullProfile,
      include_partners_with_followed_artists: includePartnersWithFollowedArtists,
      partner_categories: partnerCategories,
      ...locationArgs,
      ..._options,
    }

    // Removes null/undefined values from options
    const cleanedOptions = pickBy(clone(options), identity)

    // Make `ids` singular to match Gravity `id`
    if (options.ids) {
      cleanedOptions.id = options.ids
      delete cleanedOptions.ids
    }
    const { body } = await partnersLoader(cleanedOptions)

    return body
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
      "defaultProfilePublic",
      "eligibleForListing",
      "excludeFollowedPartners",
      "includePartnersWithFollowedArtists",
      "ip",
      "near",
      "partnerCategories",
      "sort",
      "type"
    ),
  }),
  resolve: async (_root, args, { partnersLoader, requestLocationLoader }) => {
    const { page, size, offset } = convertConnectionArgsToGravityArgs(args)

    if (args.ip && args.near) {
      throw new Error('The "ip" and "near" arguments are mutually exclusive.')
    }

    const locationArgs = await getLocationArgs(
      args.near,
      args.ip,
      requestLocationLoader
    )

    const options = {
      id: args.ids,
      page,
      size,
      eligible_for_listing: args.eligibleForListing,
      exclude_followed_partners: args.excludeFollowedPartners,
      include_partners_with_followed_artists:
        args.includePartnersWithFollowedArtists,
      default_profile_public: args.defaultProfilePublic,
      sort: args.sort,
      partner_categories: args.partnerCategories,
      type: args.type,
      total_count: true,
      ...locationArgs,
    }

    // Removes null/undefined values from options
    const cleanedOptions = pickBy(clone(options), identity)

    const { body, headers } = await partnersLoader(cleanedOptions)
    const totalCount = parseInt(headers["x-total-count"] || "0", 10)

    return {
      totalCount,
      pageCursors: createPageCursors({ page, size }, totalCount),
      ...connectionFromArraySlice(
        body,
        pick(args, "before", "after", "first", "last"),
        {
          sliceStart: offset ?? 0,
          arrayLength: totalCount,
        }
      ),
    }
  },
}
