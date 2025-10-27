import {
  GraphQLNonNull,
  GraphQLObjectType,
  GraphQLString,
  GraphQLID,
} from "graphql"
import { mutationWithClientMutationId } from "graphql-relay"
import { ResolverContext } from "types/graphql"

const ConditionReportRequestType = new GraphQLObjectType<any, ResolverContext>({
  name: "ConditionReportRequest",
  fields: () => ({
    internalID: {
      type: new GraphQLNonNull(GraphQLID),
      resolve: (conditionReportRequest) => conditionReportRequest.id,
    },
    saleArtworkID: {
      type: GraphQLID,
      resolve: (conditionReportRequest) =>
        conditionReportRequest.sale_artwork_id,
    },
    userID: {
      type: GraphQLID,
      resolve: (conditionReportRequest) => conditionReportRequest.user_id,
    },
  }),
})

export const requestConditionReportMutation = mutationWithClientMutationId<
  any,
  any,
  ResolverContext
>({
  name: "RequestConditionReport",
  inputFields: {
    saleArtworkID: {
      type: new GraphQLNonNull(GraphQLString),
      description: "ID of the sale artwork.",
    },
  },
  outputFields: {
    conditionReportRequest: {
      type: new GraphQLNonNull(ConditionReportRequestType),
      resolve: (result) => result,
    },
  },
  mutateAndGetPayload: async (
    { saleArtworkID },
    { requestConditionReportLoader }
  ) => {
    if (!requestConditionReportLoader) {
      throw new Error("You need to be signed in to perform this action")
    }

    return requestConditionReportLoader({
      sale_artwork_id: saleArtworkID,
    })
  },
})
