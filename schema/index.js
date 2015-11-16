import Ping from './ping';
import Artwork from './artwork';
import Artist from './artist';
import Artists from './artists';
import Gene from './gene';
import OrderedSets from './ordered_sets';
import Profile from './profile';
import Partner from './partner';
import Partners from './partners';
import PartnerCategory from './partner_category';
import PartnerCategories from './partner_categories';
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
      artists: Artists,
      gene: Gene,
      profile: Profile,
      ordered_sets: OrderedSets,
      partner: Partner,
      partners: Partners,
      partner_category: PartnerCategory,
      partner_categories: PartnerCategories,
      partner_show: PartnerShow,
      sale: Sale
    }
  })
});

export default schema;
