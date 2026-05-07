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
  Thunk,
} from "graphql"
import { ResolverContext } from "types/graphql"
import Image, { normalizeImageData } from "schema/v2/image"

import { UserInterestConnection, userInterestType } from "../userInterests"
import { myLocationType } from "../me/myLocation"
import initials from "schema/v2/fields/initials"
import { UserType } from "schema/v2/user"
import { pageable } from "relay-cursor-paging"
import { convertConnectionArgsToGravityArgs } from "lib/helpers"
import { createPageCursors, paginationResolver } from "../fields/pagination"
import { connectionFromArraySlice } from "graphql-relay"
import { PartnerEngagementType } from "./partnerEngagement"
import { CollectorSummaryAttributeType } from "./types/CollectorSummaryAttribute"
import { selectCollectorAttributes } from "./helpers/selectCollectorAttributes"

export const CollectorProfileFields: Thunk<GraphQLFieldConfigMap<
  any,
  ResolverContext
>> = () => {
  const { CollectedArtistsConnection } = require("./collectedArtists")

  return {
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
          const { page, size, offset } = convertConnectionArgsToGravityArgs(
            args
          )
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
    collectedArtistsConnection: {
      type: CollectedArtistsConnection,
      description:
        "Artists collected by this user, sorted by relevance with representative medium categories",
      args: pageable({
        artworkID: {
          type: GraphQLString,
          description:
            "Artwork ID for context-aware sorting. Can be injected in conversation context.",
        },
      }),
      resolve: async (
        { id, artworkID },
        args,
        { partnerCollectorProfileCollectedArtistsLoader }
      ) => {
        if (!partnerCollectorProfileCollectedArtistsLoader) {
          return null
        }

        const artworkId = args.artworkID || artworkID
        if (!artworkId) {
          throw new Error("Please provide an artorkID")
        }

        const { page, size, offset } = convertConnectionArgsToGravityArgs(args)
        const {
          body,
          headers,
        } = await partnerCollectorProfileCollectedArtistsLoader(id, {
          artwork_id: artworkId,
          page,
          size,
          total_count: true,
        })
        const totalCount = parseInt(headers["x-total-count"] || "0", 10)

        return paginationResolver({
          totalCount,
          offset,
          page,
          size,
          body,
          args,
          resolveNode: (node) => node.artist,
        })
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
    linkedIn: {
      type: GraphQLString,
      description: "Collector's LinkedIn handle",
      resolve: ({ linked_in }) => linked_in,
    },
    instagram: {
      type: GraphQLString,
      description: "Collector's Instagram handle",
      resolve: ({ instagram }) => instagram,
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
      resolve: ({
        icon,
        name,
        location,
        profession,
        other_relevant_positions,
      }) =>
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
    collectorAttributes: {
      type: new GraphQLNonNull(
        new GraphQLList(new GraphQLNonNull(CollectorSummaryAttributeType))
      ),
      description:
        "Structured attributes describing the collector in relation to the artwork/partner.",
      args: {
        artworkID: {
          type: GraphQLString,
          description:
            "This can be specified, and is injected in a conversation context for convenience.",
        },
      },
      resolve: async (
        { id: collector_profile_id, artworkID, partnerId, owner },
        { artworkID: artworkIDFromArgs },
        { collectorProfileSummaryLoader, similarGalleriesInteractionsLoader }
      ) => {
        if (!collectorProfileSummaryLoader) {
          throw new Error("You must be signed in to perform this action.")
        }

        const { raw_attributes = {} } = await collectorProfileSummaryLoader({
          artwork_id: artworkIDFromArgs || artworkID,
          collector_profile_id,
        })

        // Fetch similar galleries data from Vortex
        const defaultSimilarGalleriesData = {
          has_purchased_from_similar_galleries: false,
          has_inquired_with_similar_galleries: false,
        }

        const fetchSimilarGalleriesData = async () => {
          if (!similarGalleriesInteractionsLoader || !partnerId || !owner?.id) {
            return defaultSimilarGalleriesData
          }

          try {
            const response = await similarGalleriesInteractionsLoader({
              user_id: owner.id,
              partner_id: partnerId,
            })
            return response?.data || defaultSimilarGalleriesData
          } catch (error) {
            console.error(
              "[schema/v2/CollectorProfile/collectorAttributes] Error fetching similar galleries data:",
              error
            )
            return defaultSimilarGalleriesData
          }
        }

        const similarGalleriesData = await fetchSimilarGalleriesData()

        return selectCollectorAttributes({
          raw_attributes,
          similarGalleriesData,
        })
      },
    },
  }
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
