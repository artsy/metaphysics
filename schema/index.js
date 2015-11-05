import Ping from './ping';
import Artwork from './artwork';
import Artist from './artist';
import Profile from './profile';
import Partner from './partner';
import Partners from './partners';
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
      profile: Profile,
      partner: Partner,
      partners: Partners,
      partner_show: PartnerShow,
      sale: Sale
    }
  })
});

export default schema;
