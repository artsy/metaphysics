import { GraphQLFieldConfigArgumentMap, GraphQLInputObjectType } from "graphql"
import {
  GraphQLEnumType,
  GraphQLFieldConfig,
  GraphQLNonNull,
  GraphQLObjectType,
  GraphQLString,
  GraphQLList,
} from "graphql"
import { ResolverContext } from "types/graphql"

type VerifyAddressTypeSource = {
  verification_status: string
  input_address: AddressTypeSource[]
  suggested_addresses: AddressTypeSource[]
}

type AddressTypeSource = {
  address: {
    address_line_1: string
    address_line_2: string
    city: string
    region: string
    postal_code: string
    country: string
  }
  lines: string[]
}

const AddressVerificationInput: GraphQLFieldConfigArgumentMap = {
  address: {
    type: new GraphQLNonNull(
      new GraphQLInputObjectType({
        name: "AddressInput",
        fields: {
          addressLine1: { type: new GraphQLNonNull(GraphQLString) },
          addressLine2: { type: GraphQLString },
          city: { type: GraphQLString },
          country: { type: new GraphQLNonNull(GraphQLString) },
          postalCode: { type: new GraphQLNonNull(GraphQLString) },
          region: { type: GraphQLString },
        },
      })
    ),
  },
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
      resolve: (result) => result.verification_status,
    },
    inputAddress: {
      type: new GraphQLObjectType<any, ResolverContext>({
        name: "InputAddressFields",
        fields: {
          address: {
            type: new GraphQLObjectType<any, ResolverContext>({
              name: "InputAddress",
              fields: {
                addressLine1: {
                  type: new GraphQLNonNull(GraphQLString),
                  resolve: (source) => source.address_line_1,
                },
                addressLine2: {
                  type: new GraphQLNonNull(GraphQLString),
                  resolve: (source) => source.address_line_2,
                },
                city: { type: new GraphQLNonNull(GraphQLString) },
                country: { type: new GraphQLNonNull(GraphQLString) },
                postalCode: { type: new GraphQLNonNull(GraphQLString) },
                region: { type: GraphQLString },
              },
            }),
          },
          lines: {
            type: new GraphQLList(GraphQLString),
          },
        },
      }),
      resolve: (result) => result.input_address,
    },
    suggestedAddresses: {
      type: new GraphQLList(
        new GraphQLObjectType<any, ResolverContext>({
          name: "SuggestedAddressFields",
          fields: {
            address: {
              type: new GraphQLObjectType<any, ResolverContext>({
                name: "SuggestedAddress",
                fields: {
                  addressLine1: {
                    type: new GraphQLNonNull(GraphQLString),
                    resolve: (source) => source.address_line_1,
                  },
                  addressLine2: {
                    type: new GraphQLNonNull(GraphQLString),
                    resolve: (source) => source.address_line_2,
                  },
                  city: { type: new GraphQLNonNull(GraphQLString) },
                  country: { type: new GraphQLNonNull(GraphQLString) },
                  postalCode: { type: new GraphQLNonNull(GraphQLString) },
                  region: { type: GraphQLString },
                },
              }),
            },
            lines: {
              type: new GraphQLList(GraphQLString),
            },
          },
        })
      ),
      resolve: (result) => result.suggested_addresses,
    },
  },
})

export const VerifyAddress: GraphQLFieldConfig<any, ResolverContext> = {
  type: VerifyAddressType,
  description: "Verify a given address.",
  args: AddressVerificationInput,
  resolve: async (
    _,
    {
      address: {
        addressLine1,
        addressLine2,
        city,
        country,
        postalCode,
        region,
      },
    },
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
