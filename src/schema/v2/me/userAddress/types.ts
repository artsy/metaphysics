import {
  GraphQLInputObjectType,
  GraphQLNonNull,
  GraphQLString,
  GraphQLUnionType,
} from "graphql"
import { ErrorsType } from "lib/gravityErrorHandler"
import { UserAddressType } from "./userAddress"

export const UserAddressAttributesInput = new GraphQLInputObjectType({
  name: "UserAddressAttributes",
  description: "Shipping address input attributes",
  fields: {
    name: {
      type: new GraphQLNonNull(GraphQLString),
      description: "Name",
    },
    addressLine1: {
      type: new GraphQLNonNull(GraphQLString),
      description: "Address line 1",
    },
    addressLine2: { type: GraphQLString, description: "Address line 2" },
    addressLine3: { type: GraphQLString, description: "Address line 3" },
    city: {
      type: new GraphQLNonNull(GraphQLString),
      description: "City",
    },
    region: { type: GraphQLString, description: "Region" },
    postalCode: { type: GraphQLString, description: "Postal code" },
    country: {
      type: new GraphQLNonNull(GraphQLString),
      description: "Country",
    },
    phoneNumber: {
      type: GraphQLString,
      description: "Phone number",
    },
    phoneNumberCountryCode: {
      type: GraphQLString,
      description: "ISO Phone number country code",
    },
  },
})

export const UserAddressOrErrorsUnion = new GraphQLUnionType({
  name: "UserAddressOrErrorsUnion",
  types: [UserAddressType, ErrorsType],
  description: "An address or errors object",
  resolveType: (obj) => {
    if (obj._type === "GravityMutationError" || obj.errors) {
      return ErrorsType
    }
    return UserAddressType
  },
})
