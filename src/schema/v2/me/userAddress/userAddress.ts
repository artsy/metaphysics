import {
  GraphQLBoolean,
  GraphQLFieldConfig,
  GraphQLNonNull,
  GraphQLObjectType,
  GraphQLString,
} from "graphql"
import { IDFields } from "../../object_identification"
import { ResolverContext } from "types/graphql"

export const UserAddressType = new GraphQLObjectType<any, ResolverContext>({
  name: "UserAddress",
  description: "User saved address",
  fields: () => ({
    ...IDFields,
    addressLine1: {
      type: new GraphQLNonNull(GraphQLString),
      description: "Address line 1",
      resolve: ({ address_line_1 }) => address_line_1,
    },
    addressLine2: {
      type: GraphQLString,
      description: "Address line 2",
      resolve: ({ address_line_2 }) => address_line_2,
    },
    addressLine3: {
      type: GraphQLString,
      description: "Address line 3",
      resolve: ({ address_line_3 }) => address_line_3,
    },
    city: {
      type: new GraphQLNonNull(GraphQLString),
      description: "City",
      resolve: ({ city }) => city,
    },
    country: {
      type: new GraphQLNonNull(GraphQLString),
      description: "Country",
      resolve: ({ country }) => country,
    },
    isDefault: {
      type: new GraphQLNonNull(GraphQLBoolean),
      description: "Is default address",
      resolve: ({ is_default }) => is_default,
    },
    name: {
      type: GraphQLString,
      description: "Name on address",
      resolve: ({ name }) => name,
    },
    phoneNumber: {
      type: GraphQLString,
      description: "Phone number",
      resolve: ({ phone_number }) => phone_number,
    },
    phoneNumberCountryCode: {
      type: GraphQLString,
      description: "Phone number country code",
      resolve: ({ phone_number_country_code }) => phone_number_country_code,
    },
    postalCode: {
      type: GraphQLString,
      description: "Postal Code",
      resolve: ({ postal_code }) => postal_code,
    },
    region: {
      type: GraphQLString,
      description: "Region",
      resolve: ({ region }) => region,
    },
  }),
})

const UserAddress: GraphQLFieldConfig<void, ResolverContext> = {
  type: UserAddressType,
}

export default UserAddress
