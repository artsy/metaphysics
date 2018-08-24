import {
  GraphQLUnionType,
  GraphQLObjectType,
  GraphQLNonNull,
  GraphQLString,
} from "graphql"

export const Ship = new GraphQLObjectType({
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
  },
})

export const Pickup = new GraphQLObjectType({
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
  resolveType: obj => (obj.country ? Ship : Pickup),
})
