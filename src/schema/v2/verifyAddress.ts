import {
  GraphQLEnumType,
  GraphQLFieldConfig,
  GraphQLNonNull,
  GraphQLObjectType,
  GraphQLString,
} from "graphql"
import { ResolverContext } from "types/graphql"

const addressInputFields = {
  addressLine1: { type: new GraphQLNonNull(GraphQLString) },
  addressLine2: { type: GraphQLString },
  city: { type: GraphQLString },
  country: { type: new GraphQLNonNull(GraphQLString) },
  postalCode: { type: new GraphQLNonNull(GraphQLString) },
  region: { type: GraphQLString },
}

interface VerifyAddressTypeSource {
  verificationStatus: string
  inputAddress: {
    addressLine1: string
    addressLine2: string
    city: string
    country: string
    postalCode: string
    region: string
  }
  suggestedAddresses: any
}

const VerificationStatuses = {
  VERIFIED_NO_CHANGE: { value: "VERIFIED_NO_CHANGE" },
  VERIFIED_WITH_CHANGES: { value: "VERIFIED_WITH_CHANGES" },
  VERIFICATION_UNAVAILABLE: { value: "VERIFICATION_UNAVAILABLE" },
  NOT_FOUND: { value: "NOT_FOUND" },
  NOT_PERFORMED: { value: "NOT_PERFORMED" },
}

const VerifyAddressType: GraphQLObjectType<
  VerifyAddressTypeSource,
  ResolverContext
> = new GraphQLObjectType<VerifyAddressTypeSource, ResolverContext>({
  name: "VerifyAddressType",
  fields: {
    verificationStatus: {
      type: new GraphQLEnumType({
        name: "VerificationStatuses",
        values: VerificationStatuses,
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
      type: GraphQLString,
      resolve: (result) => result.suggestedAddresses,
    },
  },
})

export const VerifyAddress: GraphQLFieldConfig<any, ResolverContext> = {
  type: VerifyAddressType,
  description: "Verify a given address.",
  args: addressInputFields,
  resolve: async (
    _,
    { addressLine1, addressLine2, city, country, postalCode, region },
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
      throw new Error(error)
    }
  },
}
