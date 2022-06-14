import { GraphQLString, GraphQLBoolean, GraphQLNonNull } from "graphql"
import { mutationWithClientMutationId } from "graphql-relay"
import { ResolverContext } from "types/graphql"
import { FeatureFlags } from "../featureFlags"

export interface UpdateFeatureFlagInput {
  name: string
  description?: string
  impressionData?: boolean
  type?: string
}

export const updateFeatureFlagMutation = mutationWithClientMutationId<
  UpdateFeatureFlagInput,
  any,
  ResolverContext
>({
  name: "AdminUpdateFeatureFlag",
  description: "Updates a feature flag",
  inputFields: {
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
    type: {
      type: GraphQLString,
      defaultValue: "release",
    },
  },
  outputFields: {
    featureFlags: FeatureFlags,
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
