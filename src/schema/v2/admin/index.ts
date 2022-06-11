import { GraphQLFieldConfig, GraphQLObjectType } from "graphql"
import { ResolverContext } from "types/graphql"
import { GlobalIDField } from "../object_identification"
import { FeatureFlags } from "./featureFlags"

export const AdminField: GraphQLFieldConfig<void, ResolverContext> = {
  type: new GraphQLObjectType<any, ResolverContext>({
    name: "Admin",
    fields: {
      id: GlobalIDField,
      featureFlags: FeatureFlags,
    },
  }),
  resolve: (x) => x,
}
