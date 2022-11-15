import {
  GraphQLBoolean,
  GraphQLFieldConfig,
  GraphQLFieldConfigMap,
  GraphQLID,
  GraphQLList,
  GraphQLNonNull,
  GraphQLObjectType,
  GraphQLString,
} from "graphql"
import { ResolverContext } from "types/graphql"
import date from "schema/v2/fields/date"
import Image, { normalizeImageData } from "schema/v2/image"
import { CollectorProfileFields } from "schema/v2/CollectorProfile/collectorProfile"
import { myLocationType } from "schema/v2/me/myLocation"

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
    resolve: ({ owner }) => !!owner.confirmed_at,
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
      previously_registered_for_auction ?? false,
  },
  collectorProfileArtists: {
    type: new GraphQLList(CollectorProfileArtists),
    description: "List of artists the Collector is interested in.",
    resolve: ({ collected_artist_names }) => collected_artist_names,
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
