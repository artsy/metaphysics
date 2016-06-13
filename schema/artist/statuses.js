import total from '../../lib/loaders/total';
import positron from '../../lib/loaders/positron';
import {
  GraphQLObjectType,
  GraphQLBoolean,
} from 'graphql';

const ArtistStatusesType = new GraphQLObjectType({
  name: 'ArtistStatuses',
  fields: {
    artworks: {
      type: GraphQLBoolean,
      resolve: ({ published_artworks_count }) => !!published_artworks_count,
    },
    shows: {
      type: GraphQLBoolean,
      resolve: ({ id }) => {
        return total(`related/shows`, {
          artist_id: id,
          displayable: true,
          size: 0,
        }).then(count => !!count);
      },
    },
    cv: {
      type: GraphQLBoolean,
      resolve: ({ id }) => {
        return total(`related/shows`, {
          artist_id: id,
          displayable: true,
          size: 0,
        }).then(count => count > 15);
      },
    },
    artists: {
      type: GraphQLBoolean,
      resolve: ({ id }) => {
        return total(`related/layer/main/artists`, {
          exclude_artists_without_artworks: true,
          artist: [id],
          size: 0,
        }).then(count => !!count);
      },
    },
    contemporary: {
      type: GraphQLBoolean,
      resolve: ({ id }) => {
        return total(`related/layer/contemporary/artists`, {
          exclude_artists_without_artworks: true,
          artist: [id],
          size: 0,
        }).then(count => !!count);
      },
    },
    articles: {
      type: GraphQLBoolean,
      resolve: ({ _id }) => {
        return positron('articles', {
          artist_id: _id,
          published: true,
          limit: 0,
        }).then(({ count }) => !!count);
      },
    },
    auction_lots: {
      type: GraphQLBoolean,
      resolve: ({ display_auction_link, hide_auction_link }) => {
        return display_auction_link && !hide_auction_link;
      },
    },
    biography: {
      type: GraphQLBoolean,
      resolve: ({ _id }) => {
        return positron('articles', {
          published: true,
          biography_for_artist_id: _id,
          limit: 0,
        }).then(({ count }) => !!count);
      },
    },
  },
});

const ArtistStatuses = {
  type: ArtistStatusesType,
  resolve: (artist) => artist,
};

export default ArtistStatuses;
