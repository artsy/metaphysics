import { GraphQLString, GraphQLNonNull } from "graphql"
import { discoveryCategories } from "lib/discoveryCategories"
import filterArtworksConnection from "./filterArtworksConnection"
import { createSlugFromTitle } from "./discoveryCategoriesConnection"

const baseConnection = filterArtworksConnection()

export const discoveryCategoryArtworksConnection = {
  ...baseConnection,
  description: "Filter artworks by discovery category and specific filter",
  args: {
    ...baseConnection.args,
    categorySlug: {
      type: GraphQLNonNull(GraphQLString),
      description: "The slug of the discovery category to filter artworks by",
    },
    filterSlug: {
      type: GraphQLNonNull(GraphQLString),
      description:
        "The slug of the specific filter within the category to apply",
    },
  },
  resolve: async (root, args, context, info) => {
    const { categorySlug, filterSlug, input = {}, ...otherArgs } = args

    const category = Object.values(discoveryCategories).find(
      (c) => c.slug === categorySlug
    )

    if (!category) {
      throw new Error(`Discovery category not found for slug: ${categorySlug}`)
    }

    const categoryFilters: Record<string, any> = {}

    if (!category.artworkFilters || category.artworkFilters.length === 0) {
      throw new Error(`Category ${categorySlug} has no filters available`)
    }

    const specificFilter = category.artworkFilters.find(
      (filterItem) => createSlugFromTitle(filterItem.title) === filterSlug
    )

    if (!specificFilter) {
      throw new Error(
        `Filter not found for slug: ${filterSlug} in category: ${categorySlug}`
      )
    }

    Object.keys(specificFilter).forEach((key) => {
      if (key !== "title") {
        categoryFilters[key] = specificFilter[key]
      }
    })

    const mergedInput = { ...input, ...categoryFilters }

    const modifiedArgs = { ...otherArgs, input: mergedInput }
    return baseConnection.resolve!(root, modifiedArgs, context, info)
  },
}
