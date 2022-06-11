import {
  GraphQLBoolean,
  GraphQLEnumType,
  GraphQLNonNull,
  GraphQLString,
} from "graphql"
import { mutationWithClientMutationId } from "graphql-relay"
import { ResolverContext } from "types/graphql"
import { FeatureFlags } from "../featureFlags"

export const toggleFeatureFlagMutation = mutationWithClientMutationId<
  any,
  any,
  ResolverContext
>({
  name: "AdminToggleFeatureFlag",
  description: "Toggles a feature flag on or off for a given environment",
  inputFields: {
    name: {
      type: new GraphQLNonNull(GraphQLString),
    },
    enabled: {
      type: new GraphQLNonNull(GraphQLBoolean),
    },
    environment: {
      type: new GraphQLNonNull(
        new GraphQLEnumType({
          name: "AdminToggleFeatureFlagEnvironment",
          values: {
            DEVELOPMENT: {
              value: "development",
            },
            PRODUCTION: {
              value: "production",
            },
          },
        })
      ),
    },
  },
  outputFields: {
    featureFlags: FeatureFlags,
    success: {
      type: GraphQLBoolean,
    },
  },
  mutateAndGetPayload: async (args, { adminToggleFeatureFlag }) => {
    if (!adminToggleFeatureFlag) {
      return new Error("You need to be signed in to perform this action")
    }

    try {
      await adminToggleFeatureFlag({
        id: args.name,
        environment: args.environment,
        mode: args.enabled ? "on" : "off",
      })
      return {
        success: true,
      }
    } catch (error) {
      console.error("Error toggling Feature Flag:", error)
      throw new Error(JSON.stringify(error))
    }
  },
})
