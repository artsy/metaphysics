import {
  GraphQLFieldConfig,
  GraphQLNonNull,
  GraphQLObjectType,
  GraphQLString,
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
          filterKey: string
          filterItem: any
        }> = []

        parent.artworkFilters.forEach((filterItem) => {
          const filterKeys = Object.keys(filterItem).filter(
            (key) => key !== "title"
          )
          filterKeys.forEach((filterKey) => {
            filters.push({
              href: `/collect?${filterKey}=${encodeURIComponent(
                filterItem[filterKey]
              )}`,
              title: filterItem.title,
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
