// @ts-check

import { GraphQLString, GraphQLList, GraphQLNonNull, GraphQLInt } from "graphql"
import Artist from "schema/artist"

const ArtistMatch = {
  type: new GraphQLList(Artist.type),
  description: "A Search for Artists",
  args: {
    term: {
      type: new GraphQLNonNull(GraphQLString),
      description: "Your search term",
    },
    size: {
      type: GraphQLInt,
      description: "Maximum number of items to retrieve. Default: 5.",
    },
    page: {
      type: GraphQLInt,
      description: "Page to retrieve. Default: 1.",
    },
    exclude_ids: {
      type: new GraphQLList(GraphQLString),
      description: "Exclude these MongoDB ids from results",
    },
  },
  resolve: (_root, options, _request, { rootValue: { matchArtistsLoader } }) =>
    matchArtistsLoader(options),
}

export default ArtistMatch
