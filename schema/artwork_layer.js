import Artwork from './artwork';
import gravity from '../lib/loaders/gravity';
import {
  GraphQLObjectType,
  GraphQLString,
  GraphQLList,
} from 'graphql';

const ArtworkLayerType = new GraphQLObjectType({
  name: 'ArtworkLayer',
  fields: () => ({
    id: {
      type: GraphQLString,
    },
    type: {
      type: GraphQLString,
    },
    name: {
      type: GraphQLString,
    },
    href: {
      type: GraphQLString,
      resolve: ({ more_info_url }) => more_info_url,
    },
    description: {
      type: GraphQLString,
    },
    artworks: {
      type: new GraphQLList(Artwork.type),
      resolve: ({ id, type, artwork_id }) => {
        return gravity(`related/layer/${type}/${id}/artworks`, { artwork: [artwork_id] });
      },
    },
  }),
});

export default {
  type: ArtworkLayerType,
};
