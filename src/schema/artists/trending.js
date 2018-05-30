import { keys, without } from "lodash"
import Artist from "../artist"
import {
  GraphQLString,
  GraphQLObjectType,
  GraphQLNonNull,
  GraphQLList,
  GraphQLInt,
  GraphQLEnumType,
  GraphQLBoolean,
} from "graphql"

const TrendingArtistsType = new GraphQLObjectType({
  name: "TrendingArtists",
  fields: () => ({
    artists: {
      type: new GraphQLList(Artist.type),
      resolve: (
        deltaResponse,
        _args,
        _request,
        { rootValue: { artistLoader } }
      ) => {
        const ids = without(keys(deltaResponse), "cached", "context_type")
        return Promise.all(ids.map(id => artistLoader(id)))
      },
    },
  }),
})

const TrendingMetricsType = new GraphQLEnumType({
  name: "TrendingMetrics",
  values: {
    ARTIST_AUCTION_LOT: {
      value: "artist_auction_lot",
      description:
        "Cumulative price achieved at auction. Base time period: 12 weeks",
    },
    ARTIST_FAIR: {
      value: "artist_fair",
      description: "Number of artworks in fairs. Base time period: 12 weeks.",
    },
    ARTIST_FOLLOW: {
      value: "artist_follow",
      description: "Base time period: 2 weeks",
    },
    ARTIST_INQUIRY: {
      value: "artist_inquiry",
      description: "Base time period: 1 month",
    },
    ARTIST_SAVE: {
      value: "artist_save",
      description: "Base time period: 1 month",
    },
    ARTIST_SEARCH: {
      value: "artist_search",
      description: "Base time period: 2 weeks",
    },
  },
})

const TrendingArtists = {
  type: TrendingArtistsType,
  description: "Trending artists",
  args: {
    double_time_period: {
      type: GraphQLBoolean,
      description:
        "Fetch the top artists for each metric within double the base time period",
      defaultValue: false,
    },
    method: {
      type: GraphQLString,
      description: "Trending method",
      defaultValue: "fetch",
    },
    name: {
      type: new GraphQLNonNull(TrendingMetricsType),
      description: "Trending metric name",
    },
    size: {
      type: GraphQLInt,
      description: "Number of results to return",
      defaultValue: 40,
    },
  },
  resolve: (
    root,
    { method, name, size, double_time_period },
    _request,
    { rootValue: { deltaLoader } }
  ) =>
    deltaLoader({
      method,
      n: size,
      name: name + (double_time_period ? "_2t" : ""),
    }),
}

export default TrendingArtists
