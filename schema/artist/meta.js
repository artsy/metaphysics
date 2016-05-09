import { slugs } from './maps/artist_title_slugs';
import { stripTags } from '../../lib/helpers';
import {
  GraphQLString,
  GraphQLObjectType,
} from 'graphql';


export const countDisplay = (artist) => {
  const count = artist.published_artworks_count;

  if (count < 10) { return ''; }
  if (count < 100) { return `${Math.floor(count / 10) * 10}+ `; }
  if (count < 10000) { return `${Math.floor(count / 100) * 100}+ `; }
  return `${Math.floor(count / 10000) * 10000}+ `;
};

export const metaName = (artist) => {
  if (artist.name) return stripTags(artist.name);
  return 'Unnamed Artist';
};

const ArtistMetaType = new GraphQLObjectType({
  name: 'ArtistMeta',
  fields: {
    title: {
      type: GraphQLString,
      resolve: (artist) => {
        if (slugs.indexOf(artist.id) !== -1) {
          return `${artist.name} Art - ${countDisplay(artist)}Works, Bio, News | Artsy`;
        }
        return `${metaName(artist)} - ${countDisplay(artist)}Artworks, Bio & Shows on Artsy`;
      },
    },
  },
});

export default {
  type: ArtistMetaType,
  resolve: x => x,
};
