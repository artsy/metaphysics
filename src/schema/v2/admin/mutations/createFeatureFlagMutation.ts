import { GraphQLString, GraphQLBoolean } from "graphql"
import { mutationWithClientMutationId } from "graphql-relay"
import { ResolverContext } from "types/graphql"
import { FeatureFlagType } from "../featureFlags"

export const createFeatureFlagMutation = mutationWithClientMutationId<
  any,
  any,
  ResolverContext
>({
  name: "CreateFeatureFlag",
  description: "Creates a new feature flag",
  inputFields: {
    type: {
      type: GraphQLString,
      defaultValue: "release",
    },
    name: {
      type: GraphQLString,
    },
    description: {
      type: GraphQLString,
      defaultValue: "",
    },
    impressionData: {
      type: GraphQLBoolean,
      defaultValue: false,
    },
  },
  outputFields: {
    featureFlag: {
      type: FeatureFlagType,
    },
  },
  mutateAndGetPayload: async (args, { adminCreateFeatureFlag }) => {
    if (!adminCreateFeatureFlag) {
      return new Error("You need to be signed in to perform this action")
    }

    const response = await adminCreateFeatureFlag(args)
    return response
  },
})
