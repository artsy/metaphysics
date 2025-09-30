import { GraphQLFieldConfig, GraphQLNonNull, GraphQLString } from "graphql"
import { ResolverContext } from "types/graphql"
import {
  DiscoveryCategoryUnion,
  resolveDiscoveryCategoryBySlug,
} from "./discoveryCategoriesConnection"

export const discoveryCategoryConnection: GraphQLFieldConfig<
  void,
  ResolverContext
> = {
  description: "A single discovery category for browsing art by slug",
  type: DiscoveryCategoryUnion,
  args: {
    slug: {
      type: GraphQLNonNull(GraphQLString),
      description: "The slug of the discovery category to retrieve",
    },
  },
  resolve: (_parent, args) => {
    const discoveryType = resolveDiscoveryCategoryBySlug(args.slug)

    if (!discoveryType) {
      throw new Error(`Discovery category not found for slug: ${args.slug}`)
    }

    return discoveryType
  },
}

export const discoveryCategoryResolver = async (_source: any, args: any) => {
  return resolveDiscoveryCategoryBySlug(args?.id)
}

const DiscoveryCategoryNode: GraphQLFieldConfig<void, ResolverContext> = {
  type: DiscoveryCategoryUnion,
  description: "A Discovery Category",
  args: {
    id: {
      type: new GraphQLNonNull(GraphQLString),
      description: "The slug of the Discovery Category",
    },
  },
  resolve: discoveryCategoryResolver,
}

export default DiscoveryCategoryNode
