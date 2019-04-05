import {
  GraphQLList,
  GraphQLEnumType,
  GraphQLString,
  GraphQLNonNull,
  GraphQLFieldConfig,
  GraphQLInt,
} from "graphql"
import { pageable } from "relay-cursor-paging"

import { connectionWithCursorInfo } from "schema/fields/pagination"
import { Searchable } from "schema/searchable"
import { SearchEntity } from "./SearchEntity"
import { ResolverContext } from "types/graphql"
import {
  SearchAggregationResultsType,
  SearchAggregation,
} from "schema/search/SearchAggregation"
import { map } from "lodash"
import { SearchResolver } from "./SearchResolver"

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
  page: {
    type: GraphQLInt,
    description: "If present, will be used for pagination instead of cursors.",
  },
})

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

export const Search: GraphQLFieldConfig<void, ResolverContext> = {
  type: SearchConnection,
  description: "Global search",
  args: searchArgs,
  resolve: (_source, args, context, info) => {
    const resolver = new SearchResolver(args, context, info)

    return resolver.resolve()
  },
}
