import { GraphQLFieldConfig, GraphQLNonNull, GraphQLObjectType } from "graphql"
import { ResolverContext } from "types/graphql"
import { InfiniteDiscoveryArtworksConnection } from "./infiniteDiscoveryArtworksConnection"

const InfiniteDiscoveryType = new GraphQLObjectType<any, ResolverContext>({
  name: "InfiniteDiscovery",
  description: "Schema for everything infinite discovery-related",
  fields: {
    artworksConnection: InfiniteDiscoveryArtworksConnection,
  },
})

export const InfiniteDiscovery: GraphQLFieldConfig<void, ResolverContext> = {
  type: GraphQLNonNull(InfiniteDiscoveryType),
  resolve: () => {
    // dummy response object, otherwise the nested fields won’t work
    return {}
  },
}
