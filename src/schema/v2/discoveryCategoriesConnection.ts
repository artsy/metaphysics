import {
  GraphQLFieldConfig,
  GraphQLList,
  GraphQLNonNull,
  GraphQLObjectType,
  GraphQLString,
} from "graphql"
import { connectionFromArray, connectionFromArraySlice } from "graphql-relay"
import {
  ArtworkFilters,
  marketingCollectionCategories,
  MarketingCollectionCategoriesKeys,
} from "lib/marketingCollectionCategories"
import { CursorPageable, pageable } from "relay-cursor-paging"
import { ResolverContext } from "types/graphql"
import {
  connectionWithCursorInfo,
  emptyConnection,
} from "schema/v2/fields/pagination"
import { artworkConnection } from "schema/v2/artwork"
import { convertConnectionArgsToGravityArgs } from "lib/helpers"

// Custom edge type for filtered artwork connections
const FilteredArtworkConnectionEdgeType = new GraphQLObjectType<
  any,
  ResolverContext
>({
  name: "FilteredArtworkConnectionEdge",
  fields: {
    href: {
      type: GraphQLNonNull(GraphQLString),
      description: "The href for this filtered connection",
      resolve: (parent) => parent.href,
    },
    title: {
      type: GraphQLNonNull(GraphQLString),
      description: "The display title for this filtered connection",
      resolve: (parent) => parent.title,
    },
    node: {
      type: artworkConnection.connectionType,
      description: "The filtered artwork connection",
      resolve: (parent) => parent.node,
    },
  },
})

// Custom connection type for filtered artwork connections
const FilteredArtworkConnectionType = new GraphQLObjectType<
  any,
  ResolverContext
>({
  name: "FilteredArtworkConnection",
  fields: {
    edges: {
      type: new GraphQLList(FilteredArtworkConnectionEdgeType),
      resolve: (parent) => parent.edges,
    },
  },
})

const orderedCategoryKeys: MarketingCollectionCategoriesKeys[] = [
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
  href: string
  slug: string
  title: string
  artworkFilters?: ArtworkFilters
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
    href: {
      type: GraphQLNonNull(GraphQLString),
      description: "The href of the category",
    },
    title: {
      type: GraphQLNonNull(GraphQLString),
      description: "The display title of the category",
    },
    artworkConnection: {
      type: FilteredArtworkConnectionType,
      args: pageable({}),
      description:
        "A connection of filtered artwork connections for this category",
      resolve: async (parent, args, { filterArtworksLoader }) => {
        // Only provide filtered connections for categories with artworkFilters
        if (!parent.artworkFilters) {
          return { edges: [] }
        }

        if (!filterArtworksLoader) {
          return { edges: [] }
        }

        try {
          const edges: Array<{
            href: string
            title: string
            node: any
          }> = []

          // connection for each filter
          for (const [filterKey, filterItems] of Object.entries(
            parent.artworkFilters
          )) {
            for (const filterItem of filterItems) {
              const gravityOptions = {
                ...convertConnectionArgsToGravityArgs(args),
                aggregations: ["total"],
                [filterKey]: filterItem[filterKey],
              }

              try {
                const response = await filterArtworksLoader(gravityOptions)

                // Extract data from the correct structure
                const artworks = response.hits || []
                const totalCount =
                  response.aggregations?.total?.value || artworks.length

                const artworkConnectionResult = {
                  totalCount,
                  ...connectionFromArraySlice(artworks, args, {
                    arrayLength: totalCount,
                    sliceStart: gravityOptions.offset || 0,
                  }),
                }

                edges.push({
                  href: `/collect?${filterKey}=${encodeURIComponent(
                    filterItem[filterKey]
                  )}`,
                  title: filterItem.title,
                  node: artworkConnectionResult,
                })
              } catch (error) {
                console.error(
                  `[DiscoveryCategoryType] Error fetching artworks for ${filterItem.title}:`,
                  error
                )
                edges.push({
                  href: "",
                  title: "",
                  node: emptyConnection,
                })
              }
            }
          }

          return { edges }
        } catch (error) {
          console.error(
            "[DiscoveryCategoryType] Error creating filtered connections:",
            error
          )
          return { edges: [] }
        }
      },
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

      const discoveryType: DiscoveryCategory = {
        category: category.id,
        imageUrl: category.imageUrl,
        href: category.href,
        slug: category.slug,
        title: category.title,
        artworkFilters: category.artworkFilters,
      }
      return discoveryType
    })

    return connectionFromArray(cards, args)
  },
}
