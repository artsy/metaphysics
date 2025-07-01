import {
  GraphQLFieldConfig,
  GraphQLNonNull,
  GraphQLObjectType,
  GraphQLString,
} from "graphql"
import { connectionFromArray } from "graphql-relay"
import { marketingCollectionCategories } from "lib/marketingCollectionCategories"
import { CursorPageable, pageable } from "relay-cursor-paging"
import { ResolverContext } from "types/graphql"
import { connectionWithCursorInfo } from "schema/v2/fields/pagination"

const orderedCategoryKeys = [
  "Medium",
  "Movement",
  "Collect by Size",
  "Collect by Color",
  "Collect by Price",
  "Gallery",
]

export type DiscoveryCategory = {
  category: string
  imageUrl: string
  slug: string
  title: string
}

export const DiscoveryCategoryType = new GraphQLObjectType<
  DiscoveryCategory,
  ResolverContext
>({
  name: "DiscoveryCategory",
  description: "A category for discovering and browsing art",
  fields: {
    category: {
      type: GraphQLNonNull(GraphQLString),
      description: "The ID of the category",
    },
    imageUrl: {
      type: GraphQLString,
      description: "The URL of the image representing this category",
    },
    slug: {
      type: GraphQLString,
      description: "The slug of the category",
    },
    title: {
      type: GraphQLNonNull(GraphQLString),
      description: "The display title of the category",
    },
  },
})

const DiscoveryCategoriesConnectionType = connectionWithCursorInfo({
  nodeType: DiscoveryCategoryType,
  name: "DiscoveryCategoriesConnection",
}).connectionType

export const discoveryCategoriesConnection: GraphQLFieldConfig<
  void,
  ResolverContext
> = {
  description: "A connection of discovery categories for browsing art",
  type: DiscoveryCategoriesConnectionType,
  args: pageable({}),
  resolve: (_parent, args: CursorPageable) => {
    const cards = orderedCategoryKeys.map((key) => {
      const category = marketingCollectionCategories[key]

      return {
        category: category.id,
        imageUrl: category.imageUrl,
        slug: category.slug,
        title: category.title,
      }
    })

    return connectionFromArray(cards, args)
  },
}
