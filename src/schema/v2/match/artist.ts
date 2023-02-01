import {
  GraphQLString,
  GraphQLList,
  GraphQLNonNull,
  GraphQLInt,
  GraphQLFieldConfig,
} from "graphql"
import Artist from "schema/v2/artist"
import { ResolverContext } from "types/graphql"

const ArtistMatch: GraphQLFieldConfig<void, ResolverContext> = {
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
    excludeIDs: {
      type: new GraphQLList(GraphQLString),
      description: "Exclude these MongoDB ids from results",
    },
  },
  resolve: async (
    _root,
    { excludeIDs, ..._options },
    { matchArtistsLoader }
  ) => {
    const options: any = {
      exclude_ids: excludeIDs,
      ..._options,
    }

    const response = await matchArtistsLoader(options)

    return response.body
  },
}

export default ArtistMatch
