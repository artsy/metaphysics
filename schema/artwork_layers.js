import ArtworkLayer from './artwork_layer';
import {
  GraphQLList,
} from 'graphql';

export default {
  type: new GraphQLList(ArtworkLayer.type),
};
