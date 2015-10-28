import Ping from './ping';
import Artwork from './artwork';
import Artist from './artist';
import PartnerShow from './partner_show';
import Sale from './sale';
import {
  GraphQLSchema,
  GraphQLObjectType
} from 'graphql';

let schema = new GraphQLSchema({
  query: new GraphQLObjectType({
    name: 'RootQueryType',
    fields: {
      ping: Ping,
      artwork: Artwork,
      artist: Artist,
      partner_show: PartnerShow,
      sale: Sale
    }
  })
});

export default schema;
