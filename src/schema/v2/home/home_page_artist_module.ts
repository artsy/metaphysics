import Artist from "schema/v2/artist"
import { NodeInterface } from "schema/v2/object_identification"
import { toGlobalId } from "graphql-relay"
import {
  GraphQLEnumType,
  GraphQLID,
  GraphQLNonNull,
  GraphQLList,
  GraphQLObjectType,
  GraphQLString,
  GraphQLFieldConfig,
} from "graphql"
import { totalViaLoader } from "lib/total"
import { ResolverContext } from "types/graphql"
import { getCuratedArtists } from "schema/v2/artists/curatedTrending"

// This object is used for both the `key` argument enum and to do fetching.
// The order of the artists should be 1. suggested, 2. trending, 3. popular
type Value<T> = (context: ResolverContext) => Promise<T>
export const HomePageArtistModuleTypes: {
  [key: string]: {
    description: string
    display: Value<boolean>
    resolve: Value<any>
  }
} = {
  SUGGESTED: {
    description: "Artists recommended for the specific user.",
    display: ({ suggestedSimilarArtistsLoader }) => {
      if (!suggestedSimilarArtistsLoader) return Promise.resolve(false)
      return totalViaLoader(
        suggestedSimilarArtistsLoader,
        {},
        {
          exclude_followed_artists: true,
          exclude_artists_without_forsale_artworks: true,
        }
      ).then((total) => total > 0)
    },
    resolve: ({ suggestedSimilarArtistsLoader }) => {
      if (!suggestedSimilarArtistsLoader) {
        throw new Error(
          "Both the X-USER-ID and X-ACCESS-TOKEN headers are required."
        )
      }
      return suggestedSimilarArtistsLoader({
        exclude_followed_artists: true,
        exclude_artists_without_forsale_artworks: true,
      }).then(({ body }) =>
        body.map(({ artist, sim_artist }) => ({
          ...artist,
          basedOn: sim_artist,
        }))
      )
    },
  },
  CURATED_TRENDING: {
    description: "The curated trending artists.",
    display: () => Promise.resolve(true),
    resolve: async (context) => getCuratedArtists(context),
  },
  TRENDING: {
    description: "The trending artists.",
    display: () => Promise.resolve(true),
    resolve: ({ trendingArtistsLoader }) => trendingArtistsLoader(),
  },
  POPULAR: {
    description: "The most searched for artists.",
    display: () => Promise.resolve(true),
    resolve: ({ popularArtistsLoader }) => popularArtistsLoader(),
  },
}

export const HomePageArtistModuleType = new GraphQLObjectType<
  any,
  ResolverContext
>({
  name: "HomePageArtistModule",
  interfaces: [NodeInterface],
  fields: {
    id: {
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
      resolve: ({ key }, _options, context) => {
        return HomePageArtistModuleTypes[key].resolve(context)
      },
    },
  },
})

const HomePageArtistModule: GraphQLFieldConfig<void, ResolverContext> = {
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
  resolve: (_root, args) =>
    args.key && HomePageArtistModuleTypes[args.key] ? args : null,
}

export default HomePageArtistModule
