import gravity from '../../lib/loaders/gravity';
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
      resolve: ({ id }) => {
        return gravity(`artist/${id}/artworks`, {
          published: true,
          size: 1,
        }).then(artworks => !!artworks.length);
      },
    },
    shows: {
      type: GraphQLBoolean,
      resolve: ({ id }) => {
        return gravity('related/shows', {
          artist_id: id,
          displayable: true,
          size: 1,
        }).then(shows => !!shows.length);
      },
    },
    artists: {
      type: GraphQLBoolean,
      resolve: ({ id }) => {
        return gravity(`related/layer/main/artists`, {
          exclude_artists_without_artworks: true,
          artist: [id],
        }).then(artists => !!artists.length);
      },
    },
    articles: {
      type: GraphQLBoolean,
      resolve: ({ _id }) => {
        return positron('articles', {
          published: true,
          artist_id: _id,
        }).then(articles => !!articles.count);
      },
    },
  },
});

const ArtistStatuses = {
  type: ArtistStatusesType,
  resolve: (artist) => artist,
};

export default ArtistStatuses;
