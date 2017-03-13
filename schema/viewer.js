/**
 * A "Viewer" is effectively a wildcard type to get around limitations in
 * Relay, e.g., its inability to support root nodes that contain more than one
 * argument, and lists. See https://github.com/facebook/relay/issues/112 for
 * more info
 */

import filterArtworks from './filter_artworks';
import { GraphQLObjectType } from 'graphql';

const ViewerType = new GraphQLObjectType({
  name: 'Viewer',
  description: 'A wildcard used to support complex root queries in Relay',
  fields: () => ({
    filter_artworks: filterArtworks(),
  }),
});

const Viewer = {
  type: ViewerType,
  description: 'A wildcard used to support complex root queries in Relay',
  resolve: x => x,
};

export default Viewer;
