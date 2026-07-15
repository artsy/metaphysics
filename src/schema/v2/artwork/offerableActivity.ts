import {
  GraphQLBoolean,
  GraphQLInt,
  GraphQLList,
  GraphQLObjectType,
  GraphQLString,
} from "graphql"
import { ResolverContext } from "types/graphql"
import Image, { normalizeImageData } from "schema/v2/image"
import { date } from "../fields/date"
import { PartnerOfferSourceEnumType } from "../partnerOffer"

const OfferableActivityCollectorLocationType = new GraphQLObjectType<
  any,
  ResolverContext
>({
  name: "OfferableActivityCollectorLocation",
  fields: {
    city: { type: GraphQLString },
    country: { type: GraphQLString },
  },
})

const OfferableActivityCollectorType = new GraphQLObjectType<
  any,
  ResolverContext
>({
  name: "OfferableActivityCollector",
  description:
    "A collector with eligible offerable activity on the artwork, and how they engaged with it.",
  fields: {
    internalID: {
      type: GraphQLString,
      description: "The collector profile's internal ID.",
      resolve: ({ id }) => id,
    },
    firstNameLastInitial: {
      type: GraphQLString,
      resolve: ({ first_name_last_initial }) => first_name_last_initial,
    },
    isIdentityVerified: {
      type: GraphQLBoolean,
      resolve: ({ identity_verified }) => identity_verified,
    },
    confirmedBuyerAt: date(({ confirmed_buyer_at }) => confirmed_buyer_at),
    icon: {
      type: Image.type,
      resolve: ({ icon }) => normalizeImageData(icon),
    },
    location: {
      type: OfferableActivityCollectorLocationType,
      resolve: ({ location }) => location,
    },
    sources: {
      type: new GraphQLList(PartnerOfferSourceEnumType),
      description:
        "The ways this collector engaged with the artwork (e.g. saved it and/or abandoned an order).",
      resolve: ({ sources }) => sources,
    },
  },
})

export const OfferableActivityType = new GraphQLObjectType<
  any,
  ResolverContext
>({
  name: "OfferableActivity",
  fields: {
    totalCount: {
      type: GraphQLInt,
      description: "Count of collectors with eligible offerable activities.",
    },
    collectors: {
      type: new GraphQLList(OfferableActivityCollectorType),
      description:
        "Details of the collectors with eligible offerable activities.",
      resolve: ({ collectors }) => collectors,
    },
  },
})
