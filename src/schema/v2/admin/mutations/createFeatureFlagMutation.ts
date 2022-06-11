import {
  GraphQLString,
  GraphQLBoolean,
  GraphQLList,
  GraphQLInputObjectType,
} from "graphql"
import { mutationWithClientMutationId } from "graphql-relay"
import { ResolverContext } from "types/graphql"
import {
  FeatureFlagStrategyTypeEnum,
  FeatureFlagType,
  FeatureFlagVariant,
} from "../featureFlags"

export const createFeatureFlagMutation = mutationWithClientMutationId<
  any,
  any,
  ResolverContext
>({
  name: "AdminCreateFeatureFlag",
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
    strategyType: FeatureFlagStrategyTypeEnum,
    variants: {
      type: new GraphQLList(new GraphQLInputObjectType(FeatureFlagVariant)),
    },
  },
  outputFields: {
    featureFlag: {
      type: FeatureFlagType,
      resolve: (x) => x,
    },
  },
  mutateAndGetPayload: async (args, { adminCreateFeatureFlag }) => {
    if (!adminCreateFeatureFlag) {
      return new Error("You need to be signed in to perform this action")
    }

    try {
      const response = await adminCreateFeatureFlag(args)
      return response
    } catch (error) {
      throw new Error(JSON.stringify(error))
    }
  },
})
