import {
  GraphQLBoolean,
  GraphQLFieldConfig,
  GraphQLInt,
  GraphQLNonNull,
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
    alternativeEmail: {
      description: "The alternative email for this user",
      type: GraphQLString,
      resolve: ({ alternative_email }) => alternative_email,
    },
    birthYear: {
      description: "The birth year for this user",
      type: GraphQLString,
      resolve: ({ birth_year }) => birth_year,
    },
    buyerStatus: {
      description: "The buyer status for this user",
      type: GraphQLString,
      resolve: ({ buyer_status }) => buyer_status,
    },
    city: {
      description: "The city for this user.",
      type: GraphQLString,
    },
    country: {
      description: "The country for this user.",
      type: GraphQLString,
    },
    email: {
      description: "The email for this user",
      type: GraphQLString,
    },
    employer: {
      description: "The employer for this user",
      type: GraphQLString,
    },
    first_name: {
      description: "The first name for this user",
      type: GraphQLString,
      resolve: ({ first_name }) => first_name,
    },
    gender: {
      description: "The gender for this user",
      type: GraphQLString,
    },
    industry: {
      description: "The indusrty for this user",
      type: GraphQLString,
    },
    job_title: {
      description: "The job title for this user",
      type: GraphQLString,
      resolve: ({ marital_status }) => marital_status,
    },
    last_name: {
      description: "The last name  for this user",
      type: GraphQLString,
      resolve: ({ last_name }) => last_name,
    },
    maritalStatus: {
      description: "The marital status for this user",
      type: GraphQLString,
      resolve: ({ marital_status }) => marital_status,
    },
    name: {
      description: "The name for this user",
      type: GraphQLString,
    },
    prefix: {
      description: "The prefix for this user",
      type: GraphQLString,
    },
    priceRange: {
      description: "The price range for this user",
      type: GraphQLInt,
      resolve: ({ price_range }) => price_range,
    },
    profession: {
      description: "The profession for this user",
      type: GraphQLString,
    },
    requireBidderApproval: {
      description: "If this user requires manual approval for auction bidding",
      type: new GraphQLNonNull(GraphQLBoolean),
      resolve: ({ require_bidder_approval }) => require_bidder_approval,
    },
    salaryUSD: {
      description: "The salary(USD) for this user",
      type: GraphQLInt,
      resolve: ({ salary_usd }) => salary_usd,
    },
    spouse: {
      description: "The spouse for this user",
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
  }),
})

export const UserSaleProfile: GraphQLFieldConfig<any, ResolverContext> = {
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
