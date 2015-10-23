import { GraphQLSchema, GraphQLObjectType } from 'graphql';

import Ping from './schema/ping';
import Artwork from './schema/artwork';
import Artist from './schema/artist';

var schema = new GraphQLSchema({
  query: new GraphQLObjectType({
    name: 'RootQueryType',
    fields: {
      ping: Ping,
      artwork: Artwork,
      artist: Artist
    }
  })
});

export default schema;
