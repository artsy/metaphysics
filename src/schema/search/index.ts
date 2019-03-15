import {
  GraphQLList,
  GraphQLEnumType,
  GraphQLString,
  GraphQLNonNull,
  GraphQLFieldConfig,
  visit,
  BREAK,
  GraphQLResolveInfo,
} from "graphql"
import { connectionFromArraySlice } from "graphql-relay"
import { pageable } from "relay-cursor-paging"

import { connectionWithCursorInfo } from "schema/fields/pagination"
import { createPageCursors } from "schema/fields/pagination"
import { convertConnectionArgsToGravityArgs } from "lib/helpers"
import { SearchableItem } from "schema/searchableItem"
import { Searchable } from "schema/searchable"
import { SearchEntity } from "./SearchEntity"
import { ResolverContext } from "types/graphql"
import {
  SearchAggregationResultsType,
  SearchAggregation,
} from "schema/search/SearchAggregation"
import { map } from "lodash"

export const SearchMode = new GraphQLEnumType({
  name: "SearchMode",
  values: {
    AUTOSUGGEST: {
      value: "AUTOSUGGEST",
    },
    SITE: {
      value: "SITE",
    },
  },
})

export const searchArgs = pageable({
  query: {
    type: new GraphQLNonNull(GraphQLString),
    description: "Search query to perform. Required.",
  },
  entities: {
    type: new GraphQLList(SearchEntity),
    description: "Entities to include in search. Default: [ARTIST, ARTWORK].",
  },
  mode: {
    type: SearchMode,
    description: "Mode of search to execute. Default: SITE.",
  },
  aggregations: {
    type: new GraphQLList(SearchAggregation),
  },
})

const fetch = (
  searchResultItem,
  { artistLoader, artworkLoader, articleLoader }: ResolverContext
) => {
  const loaderMapping = {
    Artist: artistLoader,
    Artwork: artworkLoader,
    Article: articleLoader,
  }

  const loader = loaderMapping[searchResultItem.label]

  if (loader) {
    return loader(searchResultItem.id)
  }
}

// Fetch the full object if the GraphQL query includes any inline fragments
// referencing the search result item's type (like Artist or Artwork)
const shouldFetch = (searchResultItem, info: GraphQLResolveInfo) => {
  let fetch = false

  visit(info.fieldNodes[0], {
    Field(node) {
      if (node.name.value === "node") {
        visit(node, {
          InlineFragment(node) {
            if (
              node.typeCondition &&
              (node.typeCondition.name.value !== Searchable.name &&
                node.typeCondition.name.value !== SearchableItem.name) &&
              node.typeCondition.name.value === searchResultItem.label
            ) {
              fetch = true
              return BREAK
            }
          },
          FragmentSpread(_node) {
            throw new Error(
              "Named fragment spreads are currently unsupported for search."
            )
          },
        })
      }
    },
  })

  return fetch
}

export const SearchAggregations: GraphQLFieldConfig<any, ResolverContext> = {
  description: "Returns aggregation counts for the given filter query.",
  type: new GraphQLList(SearchAggregationResultsType),
  resolve: ({ aggregations }) => {
    return map(aggregations, (counts, slice) => ({
      slice,
      counts,
    }))
  },
}

const SearchConnection = connectionWithCursorInfo(Searchable, {
  aggregations: SearchAggregations,
})

const processSearchResultItem = (
  searchResultItem,
  info: GraphQLResolveInfo,
  context: ResolverContext
) => {
  if (shouldFetch(searchResultItem, info)) {
    return fetch(searchResultItem, context).then(response => {
      return {
        ...response,
        __typename: searchResultItem.label,
      }
    })
  } else {
    return Promise.resolve({
      ...searchResultItem,
      __typename: "SearchableItem",
    })
  }
}

export const Search: GraphQLFieldConfig<void, ResolverContext> = {
  type: SearchConnection,
  description: "Global search",
  args: searchArgs,
  resolve: (_source, args, context, info) => {
    const pageOptions = convertConnectionArgsToGravityArgs(args)
    const { page, size } = pageOptions

    const gravityArgs = {
      ...pageOptions,
      entities: args.entities,
      total_count: true,
    }

    return context.searchLoader(gravityArgs).then(({ body, headers }) => {
      const totalCount = parseInt(headers["x-total-count"])
      const pageCursors = createPageCursors(pageOptions, totalCount)
      const totalPages = Math.ceil(totalCount / size)

      let results = body
      if (args.aggregations) {
        results = body.results
      }
      return Promise.all(
        results.map(searchResultItem =>
          processSearchResultItem(searchResultItem, info, context)
        )
      ).then(processedSearchResults => {
        const connection = connectionFromArraySlice(
          processedSearchResults,
          args,
          {
            arrayLength: totalCount,
            sliceStart: pageOptions.offset,
          }
        )

        return {
          aggregations: body.aggregations,
          pageCursors: pageCursors,
          totalCount,
          ...connection,
          pageInfo: {
            ...connection.pageInfo,
            hasPreviousPage: page > 1,
            hasNextPage: page < totalPages,
          },
        }
      })
    })
  },
}
