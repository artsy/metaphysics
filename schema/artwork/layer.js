import Artwork from './index';
import gravity from '../../lib/loaders/gravity';
import { IDFields } from '../object_identification';
import {
  GraphQLObjectType,
  GraphQLString,
  GraphQLList,
  GraphQLInt,
} from 'graphql';

const ArtworkLayerType = new GraphQLObjectType({
  name: 'ArtworkLayer',
  fields: () => ({
    ...IDFields,
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
      args: {
        size: {
          type: GraphQLInt,
        },
      },
      type: new GraphQLList(Artwork.type),
      resolve: ({ id, type, artwork_id }, { size }) => {
        return gravity(`related/layer/${type}/${id}/artworks`, { artwork: [artwork_id], size });
      },
    },
  }),
});

export default {
  type: ArtworkLayerType,
};
