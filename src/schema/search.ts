import {
  GraphQLList,
  GraphQLEnumType,
  GraphQLString,
  GraphQLObjectType,
  GraphQLUnionType,
} from "graphql"

import Artist from "./artist"
import Artwork from "./artwork"
import Image from "./image"

export const SearchIndex = {
  type: new GraphQLEnumType({
    name: "SearchIndexes",
    values: {
      ARTWORK: {
        value: "Artwork",
      },
      ARTIST: {
        value: "Artist",
      },
    },
  }),
}

export const SearchType = {
  type: new GraphQLEnumType({
    name: "SearchType",
    values: {
      SITE: {
        value: "SITE",
      },
      AUTOSUGGEST: {
        value: "AUTOSUGGEST",
      },
    },
  }),
}

export const searchArgs = {
  term: {
    type: GraphQLString,
  },
  indexes: {
    type: new GraphQLList(SearchIndex.type),
  },
  type: {
    type: SearchType.type,
  },
}

export const SearchResultItemType = new GraphQLUnionType({
  name: "SearchResultItemType",
  types: [Artist.type, Artwork.type],
})

const SearchResult = new GraphQLObjectType({
  description: "Result from search query",
  name: "SearchResult",
  fields: {
    image: {
      type: Image.type,
      description: "Image",
    },
    display: {
      type: GraphQLString,
      description: "Display text",
    },
    item: {
      type: new GraphQLList(SearchResultItemType),
      description: "Object associated with search result",
    },
  },
})

export const Search = {
  type: new GraphQLList(SearchResult),
  description: "Global search",
  args: searchArgs,
  resolve: (_root, options, _request, { rootValue: { searchLoader } }) =>
    searchLoader(options),
}
