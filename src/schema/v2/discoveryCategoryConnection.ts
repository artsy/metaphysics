import { GraphQLFieldConfig, GraphQLNonNull, GraphQLString } from "graphql"
import { discoveryCategories } from "lib/discoveryCategories"
import { ResolverContext } from "types/graphql"
import {
  DiscoveryCategoryType,
  DiscoveryCategory,
} from "./discoveryCategoriesConnection"

export const discoveryCategoryConnection: GraphQLFieldConfig<
  void,
  ResolverContext
> = {
  description: "A single discovery category for browsing art by slug",
  type: DiscoveryCategoryType,
  args: {
    slug: {
      type: GraphQLNonNull(GraphQLString),
      description: "The slug of the discovery category to retrieve",
    },
  },
  resolve: (_parent, args) => {
    const categoryEntry = Object.entries(discoveryCategories).find(
      ([, category]) => category.slug === args.slug
    )

    if (!categoryEntry) {
      throw new Error(`Discovery category not found for slug: ${args.slug}`)
    }

    const [, category] = categoryEntry

    const discoveryType: DiscoveryCategory = {
      id: category.slug,
      category: category.id,
      imageUrl: category.imageUrl,
      href: category.href,
      slug: category.slug,
      title: category.title,
      artworkFilters: category.artworkFilters,
    }

    return discoveryType
  },
}

export const discoveryCategoryResolver = async (_source: any, args: any) => {
  const categoryEntry = Object.entries(discoveryCategories).find(
    ([, category]) => category.slug === args?.id
  )

  if (!categoryEntry) {
    return null
  }

  const [, category] = categoryEntry

  const discoveryType: DiscoveryCategory = {
    id: category.slug,
    category: category.id,
    imageUrl: category.imageUrl,
    href: category.href,
    slug: category.slug,
    title: category.title,
    artworkFilters: category.artworkFilters,
  }

  return discoveryType
}

const DiscoveryCategoryNode: GraphQLFieldConfig<void, ResolverContext> = {
  type: DiscoveryCategoryType,
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
