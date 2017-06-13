import gravity from "lib/loaders/gravity"
import { CollectorProfileFields } from "./collector_profile"
import { GraphQLBoolean, GraphQLString } from "graphql"
import { mutationWithClientMutationId } from "graphql-relay"

export default mutationWithClientMutationId({
  name: "UpdateCollectorProfile",
  decription: "Updating a collector profile (loyalty applicant status).",
  inputFields: {
    loyalty_applicant: {
      type: GraphQLBoolean,
    },
    professional_buyer: {
      type: GraphQLBoolean,
    },
    self_reported_purchases: {
      type: GraphQLString,
    },
  },
  outputFields: CollectorProfileFields,
  mutateAndGetPayload: (
    { loyalty_applicant, professional_buyer, self_reported_purchases },
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
    })
  },
})
