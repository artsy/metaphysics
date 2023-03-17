import {
  GraphQLObjectType,
  GraphQLBoolean,
  GraphQLInt,
  GraphQLFieldConfig,
  GraphQLNonNull,
} from "graphql"
import { totalViaLoader } from "lib/total"
import { ResolverContext } from "types/graphql"
import { biographyBlurbArgs, biographyBlurbResolver } from "./biographyBlurb"

const ArtistStatusesType = new GraphQLObjectType<any, ResolverContext>({
  name: "ArtistStatuses",
  fields: {
    artists: {
      type: new GraphQLNonNull(GraphQLBoolean),
      resolve: async ({ id }, _options, { relatedMainArtistsLoader }) => {
        try {
          const count = totalViaLoader(
            relatedMainArtistsLoader,
            {},
            { exclude_artists_without_artworks: true, artist: [id] }
          )

          return count > 0
        } catch (error) {
          return false
        }
      },
    },
    articles: {
      type: new GraphQLNonNull(GraphQLBoolean),
      resolve: async ({ _id }, _options, { articlesLoader }) => {
        try {
          const { count } = await articlesLoader({
            artist_id: _id,
            published: true,
            in_editorial_feed: true,
            limit: 0,
            count: true,
          })

          return count > 0
        } catch (error) {
          return false
        }
      },
    },
    artworks: {
      type: new GraphQLNonNull(GraphQLBoolean),
      resolve: ({ published_artworks_count }) => published_artworks_count > 0,
    },
    auctionLots: {
      type: new GraphQLNonNull(GraphQLBoolean),
      resolve: ({ display_auction_link }) => {
        return !!display_auction_link
      },
    },
    biography: {
      type: new GraphQLNonNull(GraphQLBoolean),
      resolve: async ({ _id }, _options, { articlesLoader }) => {
        try {
          const { count } = await articlesLoader({
            published: true,
            biography_for_artist_id: _id,
            limit: 0,
          })

          return count > 0
        } catch (error) {
          return false
        }
      },
    },
    biographyBlurb: {
      type: new GraphQLNonNull(GraphQLBoolean),
      args: biographyBlurbArgs,
      resolve: async (...props) => {
        try {
          const res = await biographyBlurbResolver(...props)
          return res.text.length > 0
        } catch (error) {
          return false
        }
      },
    },
    contemporary: {
      type: new GraphQLNonNull(GraphQLBoolean),
      resolve: async (
        { id },
        _options,
        { relatedContemporaryArtistsLoader }
      ) => {
        try {
          const count = await totalViaLoader(
            relatedContemporaryArtistsLoader,
            {},
            { exclude_artists_without_artworks: true, artist: [id] }
          )

          return count > 0
        } catch (error) {
          return false
        }
      },
    },
    cv: {
      type: new GraphQLNonNull(GraphQLBoolean),
      args: {
        minShowCount: {
          type: GraphQLInt,
          description:
            "Suppress the cv tab when artist show count is less than this.",
          defaultValue: 15,
        },
      },
      resolve: ({ partner_shows_count }, { minShowCount }) => {
        return partner_shows_count > minShowCount
      },
    },
    shows: {
      type: new GraphQLNonNull(GraphQLBoolean),
      resolve: ({ displayable_partner_shows_count }) => {
        return displayable_partner_shows_count > 0
      },
    },
  },
})

const ArtistStatuses: GraphQLFieldConfig<any, ResolverContext> = {
  type: new GraphQLNonNull(ArtistStatusesType),
  resolve: (artist) => artist,
}

export default ArtistStatuses
