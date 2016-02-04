import Ping from './ping';
import Article from './article';
import Articles from './articles';
import Artwork from './artwork';
import Artist from './artist';
import Artists from './artists';
import Fair from './fair';
import Gene from './gene';
import OrderedSets from './ordered_sets';
import Profile from './profile';
import Partner from './partner';
import Partners from './partners';
import FilterPartners from './filter_partners';
import PartnerCategory from './partner_category';
import PartnerCategories from './partner_categories';
import PartnerShow from './partner_show';
import PartnerShows from './partner_shows';
import Sale from './sale';
import SaleArtwork from './sale_artwork';
import Search from './search';
import Me from './me';
import {
  GraphQLSchema,
  GraphQLObjectType,
} from 'graphql';

const schema = new GraphQLSchema({
  query: new GraphQLObjectType({
    name: 'RootQueryType',
    fields: {
      ping: Ping,
      article: Article,
      articles: Articles,
      artwork: Artwork,
      artist: Artist,
      artists: Artists,
      fair: Fair,
      gene: Gene,
      profile: Profile,
      ordered_sets: OrderedSets,
      partner: Partner,
      partners: Partners,
      filter_partners: FilterPartners,
      partner_category: PartnerCategory,
      partner_categories: PartnerCategories,
      partner_show: PartnerShow,
      partner_shows: PartnerShows,
      sale: Sale,
      sale_artwork: SaleArtwork,
      search: Search,
      me: Me,
    },
  }),
});

export default schema;
