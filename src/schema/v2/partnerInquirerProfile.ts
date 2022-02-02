import {
  GraphQLBoolean,
  GraphQLFieldConfig,
  GraphQLFieldConfigMap,
  GraphQLObjectType,
  GraphQLString,
} from "graphql"
import { ResolverContext } from "types/graphql"
import date from "./fields/date"
import Image, { normalizeImageData } from "./image"
import { CollectorProfileFields } from "./me/collector_profile"
import { myLocationType } from "./me/myLocation"

export const CollectorProfileArtists = new GraphQLObjectType<
  any,
  ResolverContext
>({
  name: "CollectorProfileArtists",
  fields: {
    name: { type: GraphQLString },
  },
})

const InquirerCollectorProfileFields: GraphQLFieldConfigMap<
  any,
  ResolverContext
> = {
  ...CollectorProfileFields,
  location: { type: myLocationType },
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
  collectorProfileArtists: {
    type: CollectorProfileArtists,
    resolve: ({ collector_artists }) => collector_artists,
  },
}

const InquirerCollectorProfileType = new GraphQLObjectType<
  any,
  ResolverContext
>({
  name: "InquirerCollectorProfile",
  fields: InquirerCollectorProfileFields,
})

export const PartnerInquirerCollectorProfile: GraphQLFieldConfig<
  void,
  ResolverContext
> = {
  type: InquirerCollectorProfileType,
  description: "Inquiry requester's profile",
}

export const InquiryRequestType = new GraphQLObjectType<any, ResolverContext>({
  name: "PartnerInquiryRequest",
  fields: {
    collectorProfile: {
      type: InquirerCollectorProfileType,
      resolve: (collectorProfile) => collectorProfile,
    },
  },
})
