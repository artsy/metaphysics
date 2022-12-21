import date from "schema/v2/fields/date"
import { InternalIDFields } from "schema/v2/object_identification"
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

import { userInterestType } from "../userInterests"
import { myLocationType } from "../me/myLocation"

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
  privacy: { type: GraphQLString },
  professionalBuyerAppliedAt: date,
  professionalBuyerAt: date,
  selfReportedPurchases: {
    type: GraphQLString,
    resolve: ({ self_reported_purchases }) => self_reported_purchases,
  },
  userInterests: {
    type: new GraphQLNonNull(new GraphQLList(userInterestType)),
    resolve: (_collectorProfile, _args, { meUserInterestsLoader }) => {
      return meUserInterestsLoader?.()
    },
  },

  // moved InquirerCollectorProfileFields here
  location: { type: myLocationType },
  artsyUserSince: date,
  ownerID: {
    type: new GraphQLNonNull(GraphQLID),
    description: "User ID of the collector profile's owner",
    resolve: ({ owner: { id } }) => id,
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
    resolve: ({ owner }) => !!owner.confirmed_at,
  },
  isEmailConfirmed: {
    type: GraphQLBoolean,
    resolve: ({ owner }) => !!owner.confirmed_at,
  },
  identityVerified: {
    type: GraphQLBoolean,
    deprecationReason:
      "identityVerified is going to be removed, use isIdentityVerified instead",
    resolve: ({ owner }) => owner.identity_verified,
  },
  isIdentityVerified: {
    type: GraphQLBoolean,
    resolve: ({ owner }) => owner.identity_verified,
  },
  isActiveInquirer: {
    type: GraphQLBoolean,
    resolve: ({ artwork_inquiry_requests_count }) =>
      artwork_inquiry_requests_count >= 25,
  },
  isActiveBidder: {
    type: GraphQLBoolean,
    resolve: ({ previously_registered_for_auction }) =>
      previously_registered_for_auction ?? false,
  },
  collectorProfileArtists: {
    type: new GraphQLList(
      new GraphQLObjectType<any, ResolverContext>({
        name: "CollectorProfileArtists",
        fields: {
          name: { type: GraphQLString },
        },
      })
    ),
    description: "List of artists the Collector is interested in.",
    resolve: ({ collected_artist_names }) => collected_artist_names,
  },
}

export const CollectorProfileType = new GraphQLObjectType<any, ResolverContext>(
  {
    name: "CollectorProfileType",
    fields: CollectorProfileFields,
  }
)

export const CollectorProfile: GraphQLFieldConfig<void, ResolverContext> = {
  type: CollectorProfileType,
  description: "A collector profile.",
  resolve: (_root, _option, { meCollectorProfileLoader }) => {
    return meCollectorProfileLoader?.()
  },
}
