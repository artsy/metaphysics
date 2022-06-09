import { GraphQLFieldConfig, GraphQLObjectType } from "graphql"
import { ResolverContext } from "types/graphql"
import { FeatureFlags } from "./featureFlags"

export const AdminField: GraphQLFieldConfig<void, ResolverContext> = {
  type: new GraphQLObjectType<any, ResolverContext>({
    name: "Admin",
    fields: {
      featureFlags: FeatureFlags,
    },
  }),
  resolve: (x) => x,
}
