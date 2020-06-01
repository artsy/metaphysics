import {
  GraphQLUnionType,
  GraphQLObjectType,
  GraphQLNonNull,
  GraphQLString,
} from "graphql"
import { ResolverContext } from "types/graphql"

export const Ship = new GraphQLObjectType<any, ResolverContext>({
  name: "Ship",
  fields: {
    name: {
      type: GraphQLString,
      description: "Name for the shipping information",
    },
    addressLine1: {
      type: GraphQLString,
      description: "Shipping address line 1",
    },
    addressLine2: {
      type: GraphQLString,
      description: "Shipping address line 2",
    },
    city: {
      type: GraphQLString,
      description: "Shipping city",
    },
    region: {
      type: GraphQLString,
      description: "Shipping region",
    },
    country: {
      type: new GraphQLNonNull(GraphQLString),
      description: "Shipping country",
    },
    postalCode: {
      type: GraphQLString,
      description: "Shipping postal code",
    },
    phoneNumber: {
      type: GraphQLString,
      description: "Shipping phone number",
    },
  },
})

export const Pickup = new GraphQLObjectType<any, ResolverContext>({
  name: "Pickup",
  fields: {
    fulfillmentType: {
      type: GraphQLString,
      description: "It will always be PICKUP",
    },
  },
})

export const RequestedFulfillmentUnionType = new GraphQLUnionType({
  name: "RequestedFulfillment",
  types: [Ship, Pickup],
  resolveType: (obj) => (obj.__typename === "EcommerceShip" ? Ship : Pickup),
})
