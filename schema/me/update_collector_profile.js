import { CollectorProfileFields } from "./collector_profile"
import { GraphQLBoolean, GraphQLString, GraphQLList } from "graphql"
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
    intents: {
      type: new GraphQLList(GraphQLString),
    },
  },
  outputFields: CollectorProfileFields,
  mutateAndGetPayload: (options, request, { rootValue: { updateCollectorProfileLoader } }) => {
    if (!updateCollectorProfileLoader) {
      throw new Error("Missing Update Collector Profile Loader. Check your access token.")
    }
    return updateCollectorProfileLoader(options)
  },
})
