import date from "schema/fields/date"
import gravity from "lib/loaders/gravity"
import { IDFields } from "schema/object_identification"
import { GraphQLObjectType, GraphQLString, GraphQLInt } from "graphql"

export const CollectorProfileFields = {
  ...IDFields,
  email: {
    type: GraphQLString,
  },
  name: {
    type: GraphQLString,
  },
  confirmed_buyer_at: date,
  collector_level: {
    type: GraphQLInt,
  },
  self_reported_purchases: {
    type: GraphQLString,
  },
  loyalty_applicant_at: date,
  professional_buyer_at: date,
  professional_buyer_applied_at: date,
}

export const CollectorProfileType = new GraphQLObjectType({
  name: "CollectorProfileType",
  fields: CollectorProfileFields,
})

export default {
  type: CollectorProfileType,
  decription: "A collector profile.",
  resolve: (root, option, request, { rootValue: { accessToken } }) => {
    if (!accessToken) return null
    return gravity.with(accessToken)("me/collector_profile")
  },
}
