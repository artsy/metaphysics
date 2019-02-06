import Artist from "../artist"
import {
  GraphQLObjectType,
  GraphQLList,
  GraphQLInt,
  GraphQLBoolean,
  GraphQLString,
} from "graphql"

const PopularArtistsType = new GraphQLObjectType<ResolverContext>({
  name: "PopularArtists",
  fields: () => ({
    artists: {
      type: new GraphQLList(Artist.type),
      resolve: results => results,
    },
  }),
})

const PopularArtists = {
  type: PopularArtistsType,
  description: "Popular artists",
  args: {
    exclude_followed_artists: {
      type: GraphQLBoolean,
      description: "If true, will exclude followed artists for the user",
    },
    exclude_artist_ids: {
      type: new GraphQLList(GraphQLString),
      description:
        "Exclude these ids from results, may result in all artists being excluded.",
    },
    size: {
      type: GraphQLInt,
      description: "Number of results to return",
    },
  },
  resolve: (
    _root,
    options,
    _request,
    { rootValue: { popularArtistsLoader } }
  ) => popularArtistsLoader(options),
}

export default PopularArtists
