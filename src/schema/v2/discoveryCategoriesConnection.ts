import {
  GraphQLFieldConfig,
  GraphQLInt,
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
import { withTimeout } from "lib/loaders/helpers"
import config from "config"

// Custom type that extends artwork connection with href and title
const FilteredArtworkConnectionType = new GraphQLObjectType<
  any,
  ResolverContext
>({
  name: "FilteredArtworkConnection",
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
    totalCount: {
      type: GraphQLInt,
      description: "Total count of artworks in this connection",
      resolve: (parent) => parent.totalCount,
    },
    edges: {
      type: artworkConnection.connectionType.getFields().edges.type,
      description: "The edges of artwork connections",
      resolve: (parent) => parent.edges,
    },
    pageInfo: {
      type: artworkConnection.connectionType.getFields().pageInfo.type,
      description: "Information to aid in pagination",
      resolve: (parent) => parent.pageInfo,
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
    artworkConnections: {
      type: new GraphQLList(FilteredArtworkConnectionType),
      args: pageable({}),
      description: "A list of filtered artwork connections for this category",
      resolve: async (parent, args, { filterArtworksLoader }) => {
        // Only provide filtered connections for categories with artworkFilters
        if (!parent.artworkFilters) {
          return []
        }

        if (!filterArtworksLoader) {
          return []
        }

        try {
          // Collect all filter requests to execute in parallel
          const filterRequests: Array<{
            filterKey: string
            filterItem: any
            gravityOptions: any
          }> = []

          for (const [filterKey, filterItems] of Object.entries(
            parent.artworkFilters
          )) {
            for (const filterItem of filterItems) {
              const gravityOptions = {
                ...convertConnectionArgsToGravityArgs(args),
                aggregations: ["total"],
                [filterKey]: filterItem[filterKey],
              }

              filterRequests.push({
                filterKey,
                filterItem,
                gravityOptions,
              })
            }
          }

          // Execute all API calls in parallel with timeout
          const results = await Promise.allSettled(
            filterRequests.map(
              async ({ filterKey, filterItem, gravityOptions }) => {
                const response = (await withTimeout(
                  filterArtworksLoader(gravityOptions),
                  config.RESOLVER_TIMEOUT_MS || 5000
                )) as any

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

                return {
                  href: `/collect?${filterKey}=${encodeURIComponent(
                    filterItem[filterKey]
                  )}`,
                  title: filterItem.title,
                  ...artworkConnectionResult,
                }
              }
            )
          )

          // Process results and handle any failures
          const connections: Array<{
            href: string
            title: string
            totalCount?: number
            edges?: any[]
            pageInfo?: any
          }> = []

          results.forEach((result, index) => {
            if (result.status === "fulfilled") {
              connections.push(result.value)
            } else {
              const { filterItem } = filterRequests[index]
              console.error(
                `[DiscoveryCategoryType] Error fetching artworks for ${filterItem.title}:`,
                result.reason
              )
              connections.push({
                href: "",
                title: "",
                ...emptyConnection,
              })
            }
          })

          return connections
        } catch (error) {
          console.error(
            "[DiscoveryCategoryType] Error creating filtered connections:",
            error
          )
          return []
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
