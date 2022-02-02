import {
  GraphQLBoolean,
  GraphQLEnumType,
  GraphQLFieldConfig,
  GraphQLFieldConfigMap,
  GraphQLInt,
  GraphQLList,
  GraphQLNonNull,
  GraphQLObjectType,
  GraphQLString,
  GraphQLUnionType,
} from "graphql"
import { ResolverContext } from "types/graphql"
// import Artist from "./artist"
import { ArtistType } from "./artist"
import date from "./fields/date"
import { GeneType } from "./gene"
import Image, { normalizeImageData } from "./image"
import { myLocationType } from "./me/myLocation"
import { InternalIDFields } from "./object_identification"

const UserInterestCategoryEnum = new GraphQLEnumType({
  name: "CollectorProfileInterestCategory",
  values: {
    COLLECTED_BEFORE: { value: "collected_before" },
    INTERESTED_IN_COLLECTING: { value: "interested_in_collecting" },
  },
})

const UserInterestInterestUnion = new GraphQLUnionType({
  name: "CollectorProfileInterest",
  types: [ArtistType, GeneType],
  resolveType: (object) => ("birthday" in object ? ArtistType : GeneType),
})

const CollectorProfileInterestsType = new GraphQLObjectType<
  any,
  ResolverContext
>({
  name: "CollectorProfileInterests",
  fields: {
    ...InternalIDFields,
    body: { type: GraphQLString },
    category: { type: new GraphQLNonNull(UserInterestCategoryEnum) },
    interest: { type: new GraphQLNonNull(UserInterestInterestUnion) },
  },
})

const CollectorProfileFields: GraphQLFieldConfigMap<any, ResolverContext> = {
  ...InternalIDFields,
  location: { type: myLocationType },
  collectorLevel: {
    type: GraphQLInt,
    resolve: ({ collector_level }) => collector_level,
  },
  confirmedBuyerAt: date,
  email: { type: GraphQLString },
  institutionalAffiliations: {
    type: GraphQLString,
    resolve: ({ institutional_affiliations }) => institutional_affiliations,
  },
  intents: { type: new GraphQLList(GraphQLString) },
  loyaltyApplicantAt: date,
  name: { type: GraphQLString, resolve: ({ name }) => name },
  privacy: { type: GraphQLString },
  professionalBuyerAppliedAt: date,
  professionalBuyerAt: date,
  selfReportedPurchases: {
    type: GraphQLString,
    resolve: ({ self_reported_purchases }) => self_reported_purchases,
  },
  artsyUserSince: date,
  icon: {
    type: Image.type,
    resolve: (_root, options, { collectorProfileLoader }) => {
      if (!collectorProfileLoader) {
        throw new Error("You need to be signed in to perform this action")
      }
      return collectorProfileLoader(options).then(({ icon }) =>
        normalizeImageData(icon)
      )
    },
  },
  bio: {
    type: GraphQLString,
    resolve: (_root, options, { collectorProfileLoader }) => {
      if (!collectorProfileLoader) {
        throw new Error("You need to be signed in to perform this action")
      }
      return collectorProfileLoader(options).then(({ bio }) => bio)
    },
  },
  profession: { type: GraphQLString },
  otherRelevantPositions: {
    type: GraphQLString,
    description: "Collector's position with relevant institutions",
    resolve: ({ other_relevant_positions }) => other_relevant_positions,
  },
  emailVerified: {
    type: GraphQLBoolean,
    resolve: ({ owner }) => owner.confirmed_at ?? false,
  },
  identityVerified: {
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
      previously_registered_for_auction,
  },
  // FIXME: this breaks the code
  userInterests: {
    type: new GraphQLList(CollectorProfileInterestsType),
    resolve: ({ id }, _args, { collectorProfileInterestsLoader }) => {
      return collectorProfileInterestsLoader?.(id)
    },
  },
}

const CollectorProfileType = new GraphQLObjectType<any, ResolverContext>({
  name: "CollectorProfile",
  fields: CollectorProfileFields,
})

export const PartnerInquirerCollectorProfile: GraphQLFieldConfig<
  void,
  ResolverContext
> = {
  type: CollectorProfileType,
  description: "Inquiry requester's profile",
}

export const InquiryRequestType = new GraphQLObjectType<any, ResolverContext>({
  name: "PartnerInquiryRequest",
  fields: {
    collectorProfile: {
      type: PartnerInquirerCollectorProfile.type,
      resolve: (collectorProfile) => {
        console.log({ collectorProfile })
        return collectorProfile
      },
    },
  },
})
