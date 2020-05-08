import { GraphQLID, GraphQLFieldConfig } from "graphql"
import { ResolverContext } from "types/graphql"
import { FeatureType } from "./FeatureType"

export const Feature: GraphQLFieldConfig<void, ResolverContext> = {
  type: FeatureType,
  description: "A Feature",
  args: {
    id: {
      description: "The slug or ID of the Feature",
      type: GraphQLID,
    },
  },
  resolve: (_root, { id }, { featureLoader }) => featureLoader(id),
}
