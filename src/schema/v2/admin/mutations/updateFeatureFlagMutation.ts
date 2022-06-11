import { GraphQLString, GraphQLBoolean, GraphQLNonNull } from "graphql"
import { mutationWithClientMutationId } from "graphql-relay"
import { ResolverContext } from "types/graphql"
import { FeatureFlagType } from "../featureFlags"

export const updateFeatureFlagMutation = mutationWithClientMutationId<
  any,
  any,
  ResolverContext
>({
  name: "AdminUpdateFeatureFlag",
  description: "Updates a feature flag",
  inputFields: {
    type: {
      type: GraphQLString,
      defaultValue: "release",
    },
    name: {
      type: new GraphQLNonNull(GraphQLString),
    },
    description: {
      type: GraphQLString,
    },
    impressionData: {
      type: GraphQLBoolean,
      defaultValue: false,
    },
  },
  outputFields: {
    featureFlag: {
      type: FeatureFlagType,
      resolve: (x) => x,
    },
  },
  mutateAndGetPayload: async (args, { adminUpdateFeatureFlag }) => {
    if (!adminUpdateFeatureFlag) {
      return new Error("You need to be signed in to perform this action")
    }

    try {
      const response = await adminUpdateFeatureFlag(args.name, args)
      return response
    } catch (error) {
      throw new Error(JSON.stringify(error))
    }
  },
})
