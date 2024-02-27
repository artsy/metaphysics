import { GraphQLFieldConfig, GraphQLObjectType, GraphQLString } from "graphql"
import { ResolverContext } from "types/graphql"
import { FeatureFlagType, FeatureFlags } from "./featureFlags"

export const AdminField: GraphQLFieldConfig<void, ResolverContext> = {
  type: new GraphQLObjectType<any, ResolverContext>({
    name: "Admin",
    fields: {
      featureFlags: FeatureFlags,
      featureFlag: {
        type: FeatureFlagType,
        args: {
          id: {
            type: GraphQLString,
          },
        },
        resolve: async (_args, { id }, { adminFeatureFlagLoader }) => {
          if (!adminFeatureFlagLoader) {
            return new Error("You need to be signed in to perform this action")
          }

          try {
            const featureFlag = await adminFeatureFlagLoader(id)
            return featureFlag
          } catch (error) {
            throw new Error(JSON.stringify(error))
          }
        },
      },
    },
  }),
  resolve: (x) => x,
}
