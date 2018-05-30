import date from "schema/fields/date"
import { IDFields } from "schema/object_identification"
import {
  GraphQLObjectType,
  GraphQLString,
  GraphQLInt,
  GraphQLList,
} from "graphql"

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
  intents: {
    type: new GraphQLList(GraphQLString),
  },
}

export const CollectorProfileType = new GraphQLObjectType({
  name: "CollectorProfileType",
  fields: CollectorProfileFields,
})

export default {
  type: CollectorProfileType,
  description: "A collector profile.",
  resolve: (
    root,
    option,
    request,
    { rootValue: { accessToken, collectorProfileLoader } }
  ) => {
    if (!accessToken) return null
    return collectorProfileLoader()
  },
}
