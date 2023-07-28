import {
  GraphQLEnumType,
  GraphQLNonNull,
  GraphQLObjectType,
  GraphQLString,
  GraphQLList,
  GraphQLUnionType,
} from "graphql"
import { ResolverContext } from "types/graphql"
import {
  formatGravityError,
  GravityMutationErrorType,
} from "lib/gravityErrorHandler"
import { mutationWithClientMutationId } from "graphql-relay"

interface Input {
  addressLine1: string
  addressLine2: string
  city: string
  region: string
  postalCode: string
  country: string
  lines: string[]
}

const addressFieldsFromGravity = {
  addressLine1: {
    type: new GraphQLNonNull(GraphQLString),
    resolve: (source) => source.address_line_1,
  },
  addressLine2: {
    type: GraphQLString,
    resolve: (source) => source.address_line_2,
  },
  city: { type: new GraphQLNonNull(GraphQLString) },
  country: { type: new GraphQLNonNull(GraphQLString) },
  postalCode: {
    type: new GraphQLNonNull(GraphQLString),
    resolve: (source) => source.postal_code,
  },
  region: { type: GraphQLString },
}

const VerificationStatuses = {
  VERIFIED_NO_CHANGE: { value: "VERIFIED_NO_CHANGE" },
  VERIFIED_WITH_CHANGES: { value: "VERIFIED_WITH_CHANGES" },
  VERIFICATION_UNAVAILABLE: { value: "VERIFICATION_UNAVAILABLE" },
  NOT_FOUND: { value: "NOT_FOUND" },
  NOT_PERFORMED: { value: "NOT_PERFORMED" },
}
// VerifyAddressMutationSuccessType
const VerifyAddressType = new GraphQLObjectType<any, ResolverContext>({
  name: "VerifyAddressType",
  fields: () => ({
    verificationStatus: {
      type: new GraphQLNonNull(
        new GraphQLEnumType({
          name: "VerificationStatuses",
          values: VerificationStatuses,
        })
      ),
      resolve: (result) => result.verification_status,
    },
    inputAddress: {
      type: new GraphQLNonNull(
        new GraphQLObjectType<any, ResolverContext>({
          name: "InputAddressFields",
          fields: {
            address: {
              type: new GraphQLObjectType<any, ResolverContext>({
                name: "InputAddress",
                fields: addressFieldsFromGravity,
              }),
            },
            lines: {
              type: new GraphQLList(GraphQLString),
            },
          },
        })
      ),
      resolve: (result) => result.input_address,
    },
    suggestedAddresses: {
      type: new GraphQLNonNull(
        new GraphQLList(
          new GraphQLObjectType<any, ResolverContext>({
            name: "SuggestedAddressFields",
            fields: {
              address: {
                type: new GraphQLObjectType<any, ResolverContext>({
                  name: "SuggestedAddress",
                  fields: addressFieldsFromGravity,
                }),
              },
              lines: {
                type: new GraphQLList(GraphQLString),
              },
            },
          })
        )
      ),
      resolve: (result) => result.suggested_addresses,
    },
  }),
})

const VerifyAddressFailureType = new GraphQLObjectType<any, ResolverContext>({
  name: "VerifyAddressFailureType",
  isTypeOf: (data) => {
    return data._type === "GravityMutationError"
  },
  fields: () => ({
    mutationError: {
      type: GravityMutationErrorType,
      resolve: (err) => err,
    },
  }),
})

const VerifyAddressMutationType = new GraphQLUnionType({
  name: "VerifyAddressMutationType",
  types: [VerifyAddressType, VerifyAddressFailureType],
  resolveType: (object) => {
    if (object._type === "GravityMutationError") {
      return VerifyAddressFailureType
    }
    return VerifyAddressType
  },
})

export const VerifyAddress = mutationWithClientMutationId<
  Input,
  any,
  ResolverContext
>({
  name: "VerifyAddress",
  description: "Verify a given address.",
  inputFields: {
    addressLine1: { type: new GraphQLNonNull(GraphQLString) },
    addressLine2: { type: GraphQLString },
    city: { type: GraphQLString },
    country: { type: new GraphQLNonNull(GraphQLString) },
    postalCode: { type: new GraphQLNonNull(GraphQLString) },
    region: { type: GraphQLString },
  },
  outputFields: {
    verifyAddressOrError: {
      type: VerifyAddressMutationType,
      resolve: (result) => result,
    },
  },
  mutateAndGetPayload: async (
    { addressLine1, addressLine2, postalCode, city, region, country },
    { verifyAddressLoader }
  ) => {
    if (!verifyAddressLoader) {
      throw new Error("You need to be signed in to perform this action")
    }

    try {
      return await verifyAddressLoader({
        address_line_1: addressLine1,
        address_line_2: addressLine2,
        postal_code: postalCode,
        city: city,
        region: region,
        country: country,
      })
    } catch (error) {
      console.error(error)
      const formattedErr = formatGravityError(error)
      if (formattedErr) {
        return { ...formattedErr, _type: "GravityMutationError" }
      } else {
        throw new Error(error)
      }
    }
  },
})
