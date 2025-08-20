import { GraphQLFieldConfig, GraphQLNonNull, GraphQLString } from "graphql"
import { marketingCollectionCategories } from "lib/marketingCollectionCategories"
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
  resolve: (_parent, { slug }: { slug: string }) => {
    // Find the category by slug
    const categoryEntry = Object.entries(marketingCollectionCategories).find(
      ([, category]) => category.slug === slug
    )

    if (!categoryEntry) {
      throw new Error(`Discovery category not found for slug: ${slug}`)
    }

    const [, category] = categoryEntry

    const discoveryType: DiscoveryCategory = {
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
