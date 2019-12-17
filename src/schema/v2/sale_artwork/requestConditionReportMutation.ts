import { GraphQLString } from "graphql"
import { mutationWithClientMutationId } from "graphql-relay"
import { ResolverContext } from "types/graphql"

export const requestConditionReportMutation = mutationWithClientMutationId<
  { saleArtworkID: string },
  { saleArtwork: any },
  ResolverContext
>({
  name: "RequestConditionReport",
  description: "Request the condition report for a sale artwork.",
  inputFields: {
    saleArtworkID: {
      type: GraphQLString,
    },
  },
  outputFields: {},
  mutateAndGetPayload: (
    { saleArtworkID },
    { requestConditionReportLoader }
  ) => {
    if (!requestConditionReportLoader) {
      throw new Error("You need to be signed in to perform this action")
    }
    return requestConditionReportLoader(saleArtworkID)
  },
})
