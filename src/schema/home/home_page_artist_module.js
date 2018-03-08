import { map } from "lodash"
import Artist from "schema/artist"
import { NodeInterface } from "schema/object_identification"
import { toGlobalId } from "graphql-relay"
import {
  GraphQLEnumType,
  GraphQLID,
  GraphQLNonNull,
  GraphQLList,
  GraphQLObjectType,
  GraphQLString,
} from "graphql"
import { totalViaLoader } from "lib/total"

// This object is used for both the `key` argument enum and to do fetching.
// The order of the artists should be 1. suggested, 2. trending, 3. popular
export const HomePageArtistModuleTypes = {
  SUGGESTED: {
    description: "Artists recommended for the specific user.",
    display: ({ rootValue: { suggestedSimilarArtistsLoader } }) => {
      if (!suggestedSimilarArtistsLoader) return Promise.resolve(false)
      return totalViaLoader(
        suggestedSimilarArtistsLoader,
        {},
        {
          exclude_followed_artists: true,
          exclude_artists_without_forsale_artworks: true,
        }
      ).then(total => total > 0)
    },
    resolve: ({ rootValue: { suggestedSimilarArtistsLoader } }) => {
      if (!suggestedSimilarArtistsLoader) {
        throw new Error(
          "Both the X-USER-ID and X-ACCESS-TOKEN headers are required."
        )
      }
      return suggestedSimilarArtistsLoader({
        exclude_followed_artists: true,
        exclude_artists_without_forsale_artworks: true,
      }).then(({ body }) => map(body, "artist"))
    },
  },
  TRENDING: {
    description: "The trending artists.",
    display: () => Promise.resolve(true),
    resolve: ({ rootValue: { trendingArtistsLoader } }) =>
      trendingArtistsLoader(),
  },
  POPULAR: {
    description: "The most searched for artists.",
    display: () => Promise.resolve(true),
    resolve: ({ rootValue: { popularArtistsLoader } }) =>
      popularArtistsLoader(),
  },
}

export const HomePageArtistModuleType = new GraphQLObjectType({
  name: "HomePageArtistModule",
  interfaces: [NodeInterface],
  fields: {
    __id: {
      type: new GraphQLNonNull(GraphQLID),
      description: "A globally unique ID.",
      resolve: ({ key }) => {
        return toGlobalId("HomePageArtistModule", JSON.stringify({ key }))
      },
    },
    key: {
      description: "Module identifier.",
      type: GraphQLString,
    },
    results: {
      type: new GraphQLList(Artist.type),
      resolve: ({ key }, options, request, { rootValue }) => {
        return HomePageArtistModuleTypes[key].resolve({ rootValue })
      },
    },
  },
})

const HomePageArtistModule = {
  type: HomePageArtistModuleType,
  description: "Single artist module to show on the home screen.",
  args: {
    key: {
      description: "Module identifier.",
      type: new GraphQLEnumType({
        name: "HomePageArtistModuleTypes",
        values: HomePageArtistModuleTypes,
      }),
    },
  },
  resolve: (root, obj) =>
    obj.key && HomePageArtistModuleTypes[obj.key] ? obj : null,
}

export default HomePageArtistModule
