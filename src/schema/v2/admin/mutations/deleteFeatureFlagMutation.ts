import { GraphQLBoolean, GraphQLString } from "graphql"
import { mutationWithClientMutationId } from "graphql-relay"
import { ResolverContext } from "types/graphql"
import { FeatureFlags } from "../featureFlags"

export interface DeleteFeatureFlagInput {
  name: string
}

export const deleteFeatureFlagMutation = mutationWithClientMutationId<
  DeleteFeatureFlagInput,
  any,
  ResolverContext
>({
  name: "AdminDeleteFeatureFlag",
  description: "Deletes a feature flag",
  inputFields: {
    name: {
      type: GraphQLString,
    },
  },
  outputFields: {
    featureFlags: FeatureFlags,
    success: {
      type: GraphQLBoolean,
    },
  },
  mutateAndGetPayload: async (args, { adminDeleteFeatureFlag }) => {
    if (!adminDeleteFeatureFlag) {
      return new Error("You need to be signed in to perform this action")
    }

    try {
      await adminDeleteFeatureFlag(args.name)
      return {
        success: true,
      }
    } catch (error) {
      console.error("Error deleting Feature Flag:", error)
      throw new Error(JSON.stringify(error))
    }
  },
})
