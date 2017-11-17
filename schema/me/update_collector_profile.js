import gravity from "lib/loaders/legacy/gravity"
import { CollectorProfileFields } from "./collector_profile"
import { GraphQLBoolean, GraphQLString, GraphQLList } from "graphql"
import { mutationWithClientMutationId } from "graphql-relay"

export default mutationWithClientMutationId({
  name: "UpdateCollectorProfile",
  decription: "Updating a collector profile (loyalty applicant status).",
  inputFields: {
    loyalty_applicant: {
      type: GraphQLBoolean,
      defaultValue: false,
    },
    professional_buyer: {
      type: GraphQLBoolean,
      defaultValue: false,
    },
    self_reported_purchases: {
      type: GraphQLString,
      defaultValue: null,
    },
    intents: {
      type: new GraphQLList(GraphQLString),
    },
  },
  outputFields: CollectorProfileFields,
  mutateAndGetPayload: (
    { loyalty_applicant, professional_buyer, self_reported_purchases, intents },
    request,
    { rootValue: { accessToken } }
  ) => {
    if (!accessToken) return null
    return gravity.with(accessToken, {
      method: "PUT",
    })("me/collector_profile", {
      loyalty_applicant,
      professional_buyer,
      self_reported_purchases,
      intents,
    })
  },
})
