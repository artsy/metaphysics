import {
  GraphQLList,
  GraphQLEnumType,
  GraphQLString,
  GraphQLNonNull,
  GraphQLFieldConfig,
  visit,
  BREAK,
} from "graphql"
import { connectionFromArraySlice } from "graphql-relay"
import { pageable } from "relay-cursor-paging"

import { connectionWithCursorInfo } from "schema/fields/pagination"
import { createPageCursors } from "schema/fields/pagination"
import { convertConnectionArgsToGravityArgs } from "lib/helpers"
import { SearchableItem } from "schema/searchableItem"
import { Searchable } from "schema/searchable"

export const SearchEntity = new GraphQLEnumType({
  name: "SearchEntity",
  values: {
    ARTWORK: {
      value: "Artwork",
    },
    ARTIST: {
      value: "Artist",
    },
  },
})

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
})

const fetch = (searchResultItem, root) => {
  const loaderMapping = {
    Artist: root.artistLoader,
    Artwork: root.artworkLoader,
  }

  const loader = loaderMapping[searchResultItem.label]

  if (loader) {
    return loader(searchResultItem.id)
  }
}

// Fetch the full object if the GraphQL query includes any inline fragments
// referencing the search result item's type (like Artist or Artwork)
const shouldFetch = (searchResultItem, info) => {
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

const SearchConnection = connectionWithCursorInfo(Searchable)

const processSearchResultItem = (searchResultItem, info, source) => {
  if (shouldFetch(searchResultItem, info)) {
    return fetch(searchResultItem, source).then(response => {
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

export const Search: GraphQLFieldConfig<any, any, any> = {
  type: SearchConnection,
  description: "Global search",
  args: searchArgs,
  resolve: (source, args, _request, info) => {
    const pageOptions = convertConnectionArgsToGravityArgs(args)

    const gravityArgs = {
      ...pageOptions,
      entities: args.entities,
      total_count: true,
    }

    return source.searchLoader(gravityArgs).then(({ body, headers }) => {
      const totalCount = parseInt(headers["x-total-count"])
      const pageCursors = createPageCursors(pageOptions, totalCount)

      return Promise.all(
        body.map(searchResultItem =>
          processSearchResultItem(searchResultItem, info, source)
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
          pageCursors: pageCursors,
          totalCount,
          ...connection,
          pageInfo: {
            ...connection.pageInfo,
            hasPreviousPage: pageOptions.page > 1,
            hasNextPage:
              pageCursors.last && pageOptions.page < pageCursors.last.page,
          },
        }
      })
    })
  },
}
