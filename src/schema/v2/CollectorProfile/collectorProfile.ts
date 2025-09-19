import date, { date as dateFormatter } from "schema/v2/fields/date"

import {
  InternalIDFields,
  NodeInterface,
} from "schema/v2/object_identification"
import {
  GraphQLID,
  GraphQLObjectType,
  GraphQLString,
  GraphQLInt,
  GraphQLBoolean,
  GraphQLList,
  GraphQLFieldConfigMap,
  GraphQLNonNull,
  GraphQLFieldConfig,
} from "graphql"
import { ResolverContext } from "types/graphql"
import Image, { normalizeImageData } from "schema/v2/image"

import { UserInterestConnection, userInterestType } from "../userInterests"
import { myLocationType } from "../me/myLocation"
import initials from "schema/v2/fields/initials"
import { UserType } from "schema/v2/user"
import { pageable } from "relay-cursor-paging"
import { convertConnectionArgsToGravityArgs } from "lib/helpers"
import { createPageCursors } from "../fields/pagination"
import { connectionFromArraySlice } from "graphql-relay"
import { PartnerEngagementType } from "./partnerEngagement"

export const CollectorProfileFields: GraphQLFieldConfigMap<
  any,
  ResolverContext
> = {
  ...InternalIDFields,
  collectorLevel: {
    type: GraphQLInt,
    resolve: ({ collector_level }) => collector_level,
  },
  companyName: {
    type: GraphQLString,
    resolve: ({ company_name }) => company_name,
  },
  companyWebsite: {
    type: GraphQLString,
    resolve: ({ company_website }) => company_website,
  },
  confirmedBuyerAt: date,
  email: { type: GraphQLString },
  institutionalAffiliations: {
    type: GraphQLString,
    resolve: ({ institutional_affiliations }) => institutional_affiliations,
  },
  intents: { type: new GraphQLList(GraphQLString) },
  loyaltyApplicantAt: date,
  name: { type: GraphQLString },
  initials: initials("name"),
  firstNameLastInitial: {
    type: GraphQLString,
    resolve: ({ first_name_last_initial }) => first_name_last_initial,
  },
  partnerEngagement: {
    type: PartnerEngagementType,
    description:
      "Holds information about the engagement a collector profile has with a given partner",
    args: {
      partnerID: {
        type: new GraphQLNonNull(GraphQLID),
        description: "The ID of the partner to check for engagement",
      },
    },
    resolve: ({ id: collectorProfileID }, { partnerID }) => {
      // Inject data needed for fields within this type to resolve
      return { collectorProfileID, partnerID }
    },
  },
  privacy: { type: GraphQLString },
  professionalBuyerAppliedAt: date,
  professionalBuyerAt: date,
  selfReportedPurchases: {
    type: GraphQLString,
    resolve: ({ self_reported_purchases }) => self_reported_purchases,
  },
  userInterests: {
    deprecationReason: 'Use "owner#interestsConnection" field instead.',
    type: new GraphQLNonNull(new GraphQLList(userInterestType)),
    resolve: (_collectorProfile, _args, { meUserInterestsLoader }) => {
      return meUserInterestsLoader?.().then(({ body }) => body)
    },
  },
  interestsConnection: {
    type: UserInterestConnection,
    args: pageable({}),
    resolve: async (
      { id, partnerId },
      args,
      { partnerCollectorProfileUserInterestsLoader }
    ) => {
      if (!partnerCollectorProfileUserInterestsLoader || !partnerId) {
        return null
      }

      try {
        const { page, size, offset } = convertConnectionArgsToGravityArgs(args)
        const {
          body,
          headers,
        } = await partnerCollectorProfileUserInterestsLoader(
          { collectorProfileId: id, partnerId },
          {
            page,
            size,
            total_count: true,
          }
        )
        const totalCount = parseInt(headers["x-total-count"] || "0", 10)

        return {
          totalCount,
          pageCursors: createPageCursors({ page, size }, totalCount),
          ...connectionFromArraySlice(body, args, {
            arrayLength: totalCount,
            sliceStart: offset,
            resolveNode: (node) => node.interest,
          }),
        }
      } catch (error) {
        console.error(
          "[schema/v2/conversation/collectorResume#collectorProfile#interestsConnection] Error:",
          error
        )
        return null
      }
    },
  },
  location: { type: myLocationType },
  artsyUserSince: dateFormatter(({ artsy_user_since }) => artsy_user_since),
  ownerID: {
    type: new GraphQLNonNull(GraphQLID),
    description: "User ID of the collector profile's owner",
    resolve: ({ owner: { id } }) => id,
  },
  owner: {
    type: new GraphQLNonNull(UserType),
    resolve: ({ owner: { id } }, _args, { userByIDLoader }) => {
      return userByIDLoader(id)
    },
  },
  icon: {
    type: Image.type,
    resolve: ({ icon }) => normalizeImageData(icon),
  },
  bio: {
    type: GraphQLString,
  },
  profession: { type: GraphQLString },
  otherRelevantPositions: {
    type: GraphQLString,
    description: "Collector's position with relevant institutions",
    resolve: ({ other_relevant_positions }) => other_relevant_positions,
  },
  emailConfirmed: {
    type: GraphQLBoolean,
    deprecationReason:
      "emailConfirmed is going to be removed, use isEmailConfirmed instead",
    resolve: ({ email_confirmed_at }) => !!email_confirmed_at,
  },
  isEmailConfirmed: {
    type: GraphQLBoolean,
    resolve: ({ email_confirmed_at }) => !!email_confirmed_at,
  },
  identityVerified: {
    type: GraphQLBoolean,
    deprecationReason:
      "identityVerified is going to be removed, use isIdentityVerified instead",
    resolve: ({ identity_verified }) => identity_verified,
  },
  isIdentityVerified: {
    type: GraphQLBoolean,
    resolve: ({ identity_verified }) => identity_verified,
  },
  isActiveInquirer: {
    type: GraphQLBoolean,
    resolve: ({ artwork_inquiry_requests_count }) =>
      artwork_inquiry_requests_count >= 25,
  },
  inquiryRequestsCount: {
    type: new GraphQLNonNull(GraphQLInt),
    resolve: ({ artwork_inquiry_requests_count }) =>
      artwork_inquiry_requests_count || 0,
  },
  savedArtworksCount: {
    type: new GraphQLNonNull(GraphQLInt),
    resolve: ({ saved_artworks_count }) => saved_artworks_count || 0,
  },
  followedArtistsCount: {
    type: new GraphQLNonNull(GraphQLInt),
    resolve: ({ followed_artists_count }) => followed_artists_count || 0,
  },
  collectedArtworksCount: {
    type: new GraphQLNonNull(GraphQLInt),
    resolve: ({ collected_artworks_count }) => collected_artworks_count || 0,
  },
  totalBidsCount: {
    type: new GraphQLNonNull(GraphQLInt),
    resolve: ({ total_bids_count }) => total_bids_count || 0,
  },
  isActiveBidder: {
    type: GraphQLBoolean,
    resolve: ({ previously_registered_for_auction }) =>
      previously_registered_for_auction ?? false,
  },
  isProfileComplete: {
    type: GraphQLBoolean,
    resolve: ({ icon, name, location, profession, other_relevant_positions }) =>
      !!icon &&
      !!name &&
      !!location?.display &&
      !!profession &&
      !!other_relevant_positions,
  },
  lastUpdatePromptAt: dateFormatter(
    ({ last_update_prompt_at }) => last_update_prompt_at
  ),
  summaryParagraph: {
    type: GraphQLString,
    description: "An artwork-specific paragraph describing the collector.",
    args: {
      artworkID: {
        type: GraphQLString,
        description:
          "This can be specified, and is injected in a conversation context for convenience.",
      },
    },
    resolve: async (
      { id: collector_profile_id, artworkID },
      { artworkID: artworkIDFromArgs },
      { collectorProfileSummaryLoader }
    ) => {
      if (!collectorProfileSummaryLoader) {
        throw new Error("You must be signed in to perform this action.")
      }

      const { paragraph } = await collectorProfileSummaryLoader({
        artwork_id: artworkIDFromArgs || artworkID,
        collector_profile_id,
      })

      return paragraph
    },
  },
  summaryAttributes: {
    type: new GraphQLList(GraphQLString),
    description:
      "Up to three checkmark strings describing the collector in relation to the artwork/partner.",
    args: {
      artworkID: {
        type: GraphQLString,
        description:
          "This can be specified, and is injected in a conversation context for convenience.",
      },
    },
    resolve: async (
      { id: collector_profile_id, artworkID },
      { artworkID: artworkIDFromArgs },
      { collectorProfileSummaryLoader }
    ) => {
      if (!collectorProfileSummaryLoader) {
        throw new Error("You must be signed in to perform this action.")
      }

      const { raw_attributes = {} } = await collectorProfileSummaryLoader({
        artwork_id: artworkIDFromArgs || artworkID,
        collector_profile_id,
      })

      const results: string[] = []
      const checks = [
        {
          flag: raw_attributes.has_demonstrated_budget,
          text: "Budget similar to artwork",
        },
        {
          flag: raw_attributes.has_bought_works_from_partner,
          text: "Purchased from your gallery before",
        },
        {
          flag: raw_attributes.has_followed_partner,
          text: "Follows your gallery",
        },
        {
          flag: raw_attributes.has_inquired_about_works_from_partner,
          text: "Inquired on works from your gallery before",
        },
        {
          flag: raw_attributes.has_inquired_about_works_from_artist,
          text: "Inquired on artworks by this artist before",
        },
        {
          flag: raw_attributes.has_enabled_alerts_on_artist,
          text: "Enabled alerts on this artist",
        },
        {
          flag: raw_attributes.has_enabled_alerts_on_a_represented_artist,
          text: "Enabled alerts on artists your gallery represents",
        },
        {
          flag: raw_attributes.has_followed_a_represented_artist,
          text: "Follows an artist your gallery represents",
        },
        {
          flag: raw_attributes.has_saved_works_from_partner,
          text: "Saved works from your gallery before",
        },
      ]

      for (const { flag, text } of checks) {
        if (results.length >= 3) break
        if (flag) {
          results.push(text)
        }
      }

      // User status is prepended if there is less than 3 attributes in result.
      if (results.length < 3) {
        if (raw_attributes.is_recent_sign_up === false) {
          results.unshift("Active user")
        } else if (raw_attributes.is_recent_sign_up === true) {
          results.unshift("New user")
        }
      }

      return results
    },
  },
}

export const CollectorProfileType = new GraphQLObjectType<any, ResolverContext>(
  {
    name: "CollectorProfileType",
    interfaces: [NodeInterface],
    fields: CollectorProfileFields,
  }
)

export const MeCollectorProfile: GraphQLFieldConfig<void, ResolverContext> = {
  type: CollectorProfileType,
  description: "Current user's collector profile.",
  resolve: (_root, _option, { meCollectorProfileLoader }) => {
    return meCollectorProfileLoader?.()
  },
}

export const CollectorProfileForUser: GraphQLFieldConfig<
  void,
  ResolverContext
> = {
  type: CollectorProfileType,
  description: "A collector profile.",
  args: { userID: { type: GraphQLString! } },
  resolve: async (_root, { userID }, { collectorProfilesLoader }) => {
    if (!collectorProfilesLoader)
      throw new Error(
        "A X-Access-Token header is required to perform this action."
      )

    const { body: profiles } = await collectorProfilesLoader({
      user_id: userID,
    })

    return profiles[0]
  },
}
