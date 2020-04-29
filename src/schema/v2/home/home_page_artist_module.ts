import { ArtistType } from "schema/v2/artist"
import {
  NodeInterface,
  SlugAndInternalIDFields,
} from "schema/v2/object_identification"
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
import { HomePageArtist } from "schema/v2/home/homePageArtistInterface"
import Image from "schema/v2/image"
import { artworkConnection } from "schema/v2/artwork"

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
      ).then(total => total > 0)
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
          __typename: SuggestedArtist.name,
          ...artist,
          sim_artist,
        }))
      )
    },
  },
  TRENDING: {
    description: "The trending artists.",
    display: () => Promise.resolve(true),
    resolve: ({ trendingArtistsLoader }) =>
      trendingArtistsLoader().then(artists => {
        return artists.map(a => ({ __typename: ArtistType.name, ...a }))
      }),
  },
  POPULAR: {
    description: "The most searched for artists.",
    display: () => Promise.resolve(true),
    resolve: ({ popularArtistsLoader }) =>
      popularArtistsLoader().then(artists => {
        return artists.map(a => ({ __typename: ArtistType.name, ...a }))
      }),
  },
}

export const SuggestedArtist = new GraphQLObjectType<any, ResolverContext>({
  name: "SuggestedArtist",
  interfaces: [NodeInterface, HomePageArtist],
  fields: {
    ...SlugAndInternalIDFields,
    href: {
      type: GraphQLString,
    },
    name: {
      type: GraphQLString,
    },
    // Fall back to ArtistType implementation.
    formattedNationalityAndBirthday: {
      type: GraphQLString,
      resolve: ArtistType.getFields()["formattedNationalityAndBirthday"]
        .resolve,
    },
    // Fall back to ArtistType implementation.
    formattedArtworksCount: {
      type: GraphQLString,
      resolve: ArtistType.getFields()["formattedArtworksCount"].resolve,
    },
    image: Image,
    artworksConnection: {
      type: artworkConnection.connectionType,
    },
    basedOn: {
      type: ArtistType,
      resolve: ({ sim_artist }) => sim_artist,
    },
  },
})

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
      type: new GraphQLList(HomePageArtist),
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
