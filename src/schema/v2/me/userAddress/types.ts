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
  description: "Attributes for creating a user address",
  fields: {
    name: { type: new GraphQLNonNull(GraphQLString) },
    addressLine1: { type: new GraphQLNonNull(GraphQLString) },
    addressLine2: { type: GraphQLString },
    addressLine3: { type: GraphQLString },
    city: { type: new GraphQLNonNull(GraphQLString) },
    region: { type: GraphQLString },
    postalCode: { type: GraphQLString },
    country: { type: new GraphQLNonNull(GraphQLString) },
    phoneNumber: { type: GraphQLString },
    phoneNumberCountryCode: { type: GraphQLString },
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
