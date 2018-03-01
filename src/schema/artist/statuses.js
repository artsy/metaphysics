import { GraphQLObjectType, GraphQLBoolean } from "graphql"
import { totalViaLoader } from "lib/total"

const ArtistStatusesType = new GraphQLObjectType({
  name: "ArtistStatuses",
  fields: {
    artists: {
      type: GraphQLBoolean,
      resolve: (
        { id },
        options,
        request,
        { rootValue: { relatedMainArtistsLoader } }
      ) => {
        totalViaLoader(
          relatedMainArtistsLoader,
          {},
          { exclude_artists_without_artworks: true, artist: [id] }
        ).then(count => count > 0)
      },
    },
    articles: {
      type: GraphQLBoolean,
      resolve: ({ _id }, options, request, { rootValue: { articlesLoader } }) =>
        articlesLoader({
          artist_id: _id,
          published: true,
          limit: 0,
          count: true,
        }).then(({ count }) => count > 0),
    },
    artworks: {
      type: GraphQLBoolean,
      resolve: ({ published_artworks_count }) => published_artworks_count > 0,
    },
    auction_lots: {
      type: GraphQLBoolean,
      resolve: ({ display_auction_link, hide_auction_link }) => {
        return display_auction_link && !hide_auction_link
      },
    },
    biography: {
      type: GraphQLBoolean,
      resolve: ({ _id }, options, request, { rootValue: { articlesLoader } }) =>
        articlesLoader({
          published: true,
          biography_for_artist_id: _id,
          limit: 0,
        }).then(({ count }) => count > 0),
    },
    contemporary: {
      type: GraphQLBoolean,
      resolve: (
        { id },
        options,
        request,
        { rootValue: { relatedContemporaryArtistsLoader } }
      ) => {
        return totalViaLoader(
          relatedContemporaryArtistsLoader,
          {},
          {
            exclude_artists_without_artworks: true,
            artist: [id],
          }
        ).then(total => total > 0)
      },
    },
    cv: {
      type: GraphQLBoolean,
      resolve: ({ partner_shows_count }) => partner_shows_count > 15,
    },
    shows: {
      type: GraphQLBoolean,
      resolve: ({ displayable_partner_shows_count }) =>
        displayable_partner_shows_count > 0,
    },
  },
})

const ArtistStatuses = {
  type: ArtistStatusesType,
  resolve: artist => artist,
}

export default ArtistStatuses
