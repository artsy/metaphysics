import {
  GraphQLInt,
  GraphQLNonNull,
  GraphQLObjectType,
  GraphQLUnionType,
  GraphQLString,
  GraphQLEnumType,
} from "graphql"
import { mutationWithClientMutationId } from "graphql-relay"
import { ResolverContext } from "types/graphql"
import {
  GravityMutationErrorType,
  formatGravityError,
} from "lib/gravityErrorHandler"

const ErrorType = new GraphQLObjectType<any, ResolverContext>({
  name: "VerifyAddressMutationFailure",
  isTypeOf: (data) => {
    return data._type === "GravityMutationError"
  },
  fields: () => ({
    mutationError: {
      type: GravityMutationErrorType,
      resolve: (err) => (typeof err.message === "object" ? err.message : err),
    },
    statusCode: {
      type: GraphQLInt,
      resolve: (result) => result.statusCode,
    },
    message: {
      type: new GraphQLNonNull(GraphQLString),
      resolve: () => "Address could not be verified.",
    },
  }),
})

const SuccessType = new GraphQLObjectType<any, ResolverContext>({
  name: "VerifyAddressMutationSuccess",
  isTypeOf: (data) => data.success,
  fields: () => ({
    verificationStatus: {
      type: new GraphQLEnumType({
        name: "VerificationStatuses",
        values: {
          VERIFIED_NO_CHANGE: { value: "VERIFIED_NO_CHANGE" },
          VERIFIED_WITH_CHANGES: { value: "VERIFIED_WITH_CHANGES" },
          VERIFICATION_UNAVAILABLE: { value: "VERIFICATION_UNAVAILABLE" },
          NOT_FOUND: { value: "NOT_FOUND" },
        },
      }),
      resolve: (result) => result.verificationStatus,
    },
    inputAddress: {
      type: new GraphQLObjectType<any, ResolverContext>({
        name: "AddressInput",
        fields: addressInputFields,
      }),
      resolve: (result) => result.inputAddress,
    },
    suggestedAddresses: {
      type: new GraphQLNonNull(GraphQLString),
      resolve: (result) => result.suggestedAddresses,
    },
  }),
})

const AddressVerificationResultType = new GraphQLUnionType({
  name: "VerifyAddressMutationSuccessOrError",
  types: [SuccessType, ErrorType],
})

const addressInputFields = {
  addressLine1: { type: new GraphQLNonNull(GraphQLString) },
  addressLine2: { type: GraphQLString },
  city: { type: GraphQLString },
  country: { type: new GraphQLNonNull(GraphQLString) },
  name: { type: new GraphQLNonNull(GraphQLString) },
  postalCode: { type: new GraphQLNonNull(GraphQLString) },
  region: { type: GraphQLString },
}

export const verifyAddressMutation = mutationWithClientMutationId<
  any,
  any,
  ResolverContext
>({
  name: "verifyAddressMutation",
  description: "Verify an address.",
  inputFields: addressInputFields,
  outputFields: {
    successOrError: {
      type: AddressVerificationResultType,
      resolve: (result) => result,
    },
  },

  mutateAndGetPayload: async (args, { verifyAddressLoader }) => {
    if (!verifyAddressLoader) {
      throw new Error("You need to be signed in to perform this action")
    }

    try {
      const result = await verifyAddressLoader({
        address_line_1: args.addressLine1,
        address_line_2: args.address_line_2,
        postal_code: args.postalCode,
        city: args.city,
        region: args.region,
        country: args.country,
      })
      return result
    } catch (error) {
      const formattedErr = formatGravityError(error)
      if (formattedErr) {
        return {
          ...formattedErr,
          _type: "GravityMutationError",
          message: "Address verification could not be performed",
        }
      } else {
        throw new Error(error)
      }
    }
  },
})
