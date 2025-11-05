import {
  GraphQLFieldConfig,
  GraphQLList,
  GraphQLNonNull,
  GraphQLObjectType,
  GraphQLString,
  GraphQLUnionType,
} from "graphql"
import { NodeInterface, GlobalIDField } from "./object_identification"
import { connectionFromArray } from "graphql-relay"
import {
  ArtworkFilters,
  discoveryCategories,
  DiscoveryCategoriesKeys,
} from "lib/discoveryCategories"
import { CursorPageable, pageable } from "relay-cursor-paging"
import { ResolverContext } from "types/graphql"
import { connectionWithCursorInfo } from "schema/v2/fields/pagination"
import { filterArtworksConnectionWithParams } from "schema/v2/filterArtworksConnection"
import { MarketingCollectionType } from "./marketingCollections"
import { MARKETING_COLLECTIONS_SORTS } from "./sorts/marketingCollectionsSort"
import { convertConnectionArgsToGravityArgs } from "lib/helpers"

const ArtworkFilterNodeType = new GraphQLObjectType<any, ResolverContext>({
  name: "ArtworkFilterNode",
  fields: {
    href: {
      type: GraphQLNonNull(GraphQLString),
      description: "The href for this filtered connection",
      resolve: ({ href }) => href,
    },
    title: {
      type: GraphQLNonNull(GraphQLString),
      description: "The display title for this filtered connection",
      resolve: ({ title }) => title,
    },
    slug: {
      type: GraphQLNonNull(GraphQLString),
      description: "The slug for this filter, derived from the title",
      resolve: ({ slug }) => slug,
    },
    artworksConnection: filterArtworksConnectionWithParams(
      ({ filterKey, filterItem }) => ({
        [filterKey]: filterItem[filterKey],
      })
    ),
  },
})

const FiltersForArtworksConnectionType = connectionWithCursorInfo({
  nodeType: ArtworkFilterNodeType,
  name: "FiltersForArtworksConnection",
}).connectionType

const DiscoveryCategoryFields = {
  id: GlobalIDField,
  internalID: {
    type: GraphQLNonNull(GraphQLString),
    description: "A type-specific ID",
    resolve: ({ slug }) => slug,
  },
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
}

export const DiscoveryMarketingCollectionType = new GraphQLObjectType<
  any,
  ResolverContext
>({
  name: "DiscoveryMarketingCollection",
  description: "A discovery category that contains marketing collections",
  interfaces: [NodeInterface],
  fields: {
    ...DiscoveryCategoryFields,
    marketingCollections: {
      type: GraphQLNonNull(
        GraphQLList(GraphQLNonNull(MarketingCollectionType))
      ),
      args: pageable({}),
      description: "Marketing collections for this discovery category",
      resolve: async ({ slug }, args, { marketingCollectionsLoader }) => {
        try {
          const resolverArgs: any = {
            ...args,
            categorySlug: slug,
            sort: MARKETING_COLLECTIONS_SORTS.CURATED.value,
          }
          const { size } = convertConnectionArgsToGravityArgs(resolverArgs)

          // Handle curated sorting: transform categorySlug to collection slugs
          if (resolverArgs.sort === MARKETING_COLLECTIONS_SORTS.CURATED.value) {
            const marketingCollectionCategory = Object.values(
              discoveryCategories
            ).find((c) => c.slug === resolverArgs.categorySlug)

            if (!marketingCollectionCategory) {
              throw new Error(
                `No curated sort available for slug: ${resolverArgs.categorySlug}`
              )
            }

            resolverArgs.slugs =
              marketingCollectionCategory.sortedCollectionSlugs
            delete resolverArgs.category
            delete resolverArgs.categorySlug
            delete resolverArgs.sort
          }

          const gravityArgs = { ...resolverArgs, size }
          const result = await marketingCollectionsLoader(gravityArgs)
          return result.body || result || []
        } catch (error) {
          console.error(
            `Error loading marketing collections for category ${slug}:`,
            error
          )
          return []
        }
      },
    },
  },
})

export const DiscoveryArtworksWithFiltersCollectionType = new GraphQLObjectType<
  DiscoveryCategory,
  ResolverContext
>({
  name: "DiscoveryArtworksWithFiltersCollection",
  description: "A discovery category that contains artwork filters",
  interfaces: [NodeInterface],
  fields: {
    ...DiscoveryCategoryFields,
    filtersForArtworksConnection: {
      type: FiltersForArtworksConnectionType,
      args: pageable({}),
      description: "A connection of artwork filters for this category",
      resolve: (parent, args) => {
        if (!parent.artworkFilters) {
          return {
            ...connectionFromArray([], args),
            totalCount: 0,
          }
        }

        const filters: Array<{
          href: string
          title: string
          slug: string
          filterKey: string
          filterItem: any
        }> = []

        Object.entries(parent.artworkFilters).forEach(([slug, filterItem]) => {
          const filterKeys = Object.keys(filterItem).filter(
            (key) => key !== "title" && key !== "href"
          )
          filterKeys.forEach((filterKey) => {
            filters.push({
              href: filterItem.href,
              title: filterItem.title,
              slug,
              filterKey,
              filterItem,
            })
          })
        })

        return {
          ...connectionFromArray(filters, args),
          totalCount: filters.length,
        }
      },
    },
  },
})

export const DiscoveryCategoryUnion = new GraphQLUnionType({
  name: "DiscoveryCategoryUnion",
  description: "A union of different discovery category types",
  types: [
    DiscoveryMarketingCollectionType,
    DiscoveryArtworksWithFiltersCollectionType,
  ],
  resolveType: (value) => {
    // If the object has artworkFilters, it's the artwork filters collection type
    if (value.artworkFilters) {
      return DiscoveryArtworksWithFiltersCollectionType
    }
    // Otherwise, it's the marketing collection type
    return DiscoveryMarketingCollectionType
  },
})

const orderedCategoryKeys: DiscoveryCategoriesKeys[] = [
  "Medium",
  "Movement",
  "Collect by Size",
  "Collect by Color",
  "Collect by Price",
  "Gallery",
]

export type DiscoveryCategory = {
  id: string
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
  interfaces: [NodeInterface],
  fields: {
    id: GlobalIDField,
    internalID: {
      type: GraphQLNonNull(GraphQLString),
      description: "A type-specific ID",
      resolve: ({ slug }) => slug,
    },
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
    filtersForArtworksConnection: {
      type: FiltersForArtworksConnectionType,
      args: pageable({}),
      description: "A connection of artwork filters for this category",
      resolve: (parent, args) => {
        if (!parent.artworkFilters) {
          return {
            ...connectionFromArray([], args),
            totalCount: 0,
          }
        }

        const filters: Array<{
          href: string
          title: string
          slug: string
          filterKey: string
          filterItem: any
        }> = []

        Object.entries(parent.artworkFilters).forEach(([slug, filterItem]) => {
          const filterKeys = Object.keys(filterItem).filter(
            (key) => key !== "title" && key !== "href"
          )
          filterKeys.forEach((filterKey) => {
            filters.push({
              href: filterItem.href,
              title: filterItem.title,
              slug,
              filterKey,
              filterItem,
            })
          })
        })

        return {
          ...connectionFromArray(filters, args),
          totalCount: filters.length,
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
      const category = discoveryCategories[key]

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
    })

    return connectionFromArray(cards, args)
  },
}

export const resolveDiscoveryCategoryBySlug = (
  slug: string
): DiscoveryCategory | null => {
  const categoryEntry = Object.entries(discoveryCategories).find(
    ([, category]) => category.slug === slug
  )

  if (!categoryEntry) {
    return null
  }

  const [, category] = categoryEntry

  const result = {
    id: category.slug,
    category: category.id,
    imageUrl: category.imageUrl,
    href: category.href,
    slug: category.slug,
    title: category.title,
    artworkFilters: category.artworkFilters,
  }

  // Add __typename for GraphQL union type resolution
  if (category.artworkFilters) {
    ;(result as any).__typename = "DiscoveryArtworksWithFiltersCollection"
  } else {
    ;(result as any).__typename = "DiscoveryMarketingCollection"
  }

  return result
}

export const DiscoveryCategoryNodeResolver = {
  type: DiscoveryCategoryUnion,
  resolve: async (_source: any, args: any, _context: ResolverContext) => {
    return resolveDiscoveryCategoryBySlug(args?.id)
  },
}
