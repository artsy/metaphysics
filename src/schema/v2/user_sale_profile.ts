import {
  GraphQLBoolean,
  GraphQLFieldConfig,
  GraphQLInt,
  GraphQLObjectType,
  GraphQLString,
} from "graphql"
import { ResolverContext } from "types/graphql"
import { InternalIDFields } from "./object_identification"

export const UserSaleProfileType = new GraphQLObjectType<any, ResolverContext>({
  name: "UserSaleProfile",
  fields: () => ({
    ...InternalIDFields,
    addressLine1: {
      description: "The first line of address for this user.",
      type: GraphQLString,
      resolve: ({ address_1 }) => address_1,
    },
    addressLine2: {
      description: "The second line of address for this user.",
      type: GraphQLString,
      resolve: ({ address_2 }) => address_2,
    },
    city: {
      description: "The city for this user.",
      type: GraphQLString,
    },
    state: {
      description: "The state for this user.",
      type: GraphQLString,
    },
    zip: {
      description: "The zip for this user.",
      type: GraphQLString,
    },
    name: {
      description: "The name for this user",
      type: GraphQLString,
    },
    prefix: {
      description: "The prefix for this user",
      type: GraphQLString,
    },
    first_name: {
      description: "The first name for this user",
      type: GraphQLString,
      resolve: ({ first_name }) => first_name,
    },
    last_name: {
      description: "The marital status for this user",
      type: GraphQLString,
      resolve: ({ last_name }) => last_name,
    },
    country: {
      description: "The country for this user.",
      type: GraphQLString,
    },
    gender: {
      description: "The gender for this user",
      type: GraphQLString,
    },
    maritalStatus: {
      description: "The marital status for this user",
      type: GraphQLString,
      resolve: ({ marital_status }) => marital_status,
    },
    birthYear: {
      description: "The birth year for this user",
      type: GraphQLString,
      resolve: ({ birth_year }) => birth_year,
    },
    spouse: {
      description: "The spouse for this user",
      type: GraphQLString,
    },
    job_title: {
      description: "The job title for this user",
      type: GraphQLString,
      resolve: ({ marital_status }) => marital_status,
    },
    employer: {
      description: "The employer for this user",
      type: GraphQLString,
    },
    profession: {
      description: "The profession for this user",
      type: GraphQLString,
    },
    salaryUSD: {
      description: "The salary(USD) for this user",
      type: GraphQLInt,
      resolve: ({ salary_usd }) => salary_usd,
    },
    industry: {
      description: "The indusrty for this user",
      type: GraphQLString,
    },
    buyerStatus: {
      description: "The buyer status for this user",
      type: GraphQLString,
      resolve: ({ buyer_status }) => buyer_status,
    },
    priceRange: {
      description: "The price range for this user",
      type: GraphQLInt,
      resolve: ({ price_range }) => price_range,
    },
    email: {
      description: "The email for this user",
      type: GraphQLString,
    },
    alternativeEmail: {
      description: "The alternative email for this user",
      type: GraphQLString,
      resolve: ({ alternative_email }) => alternative_email,
    },
    requireBidderApproval: {
      description: "If this user requires manual approval for auction bidding",
      type: GraphQLBoolean,
      resolve: ({ require_bidder_approval }) => require_bidder_approval,
    },
  }),
})

export const UserSaleProfileField: GraphQLFieldConfig<any, ResolverContext> = {
  description: "The sale profile of the user.",
  type: UserSaleProfileType,
  resolve: ({ sale_profile_id }, {}, { userSaleProfileLoader }) => {
    if (!userSaleProfileLoader) {
      throw new Error(
        "You need to pass a X-Access-Token header to perform this action"
      )
    }

    return userSaleProfileLoader(sale_profile_id).catch((err) => {
      if (err.statusCode === 404) {
        return null
      }
    })
  },
}
