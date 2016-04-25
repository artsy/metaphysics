import Ping from './ping';
import Article from './article';
import Articles from './articles';
import Artwork from './artwork';
import Artist from './artist';
import Artists from './artists';
import Fair from './fair';
import Fairs from './fairs';
import Gene from './gene';
import OrderedSets from './ordered_sets';
import Profile from './profile';
import Partner from './partner';
import Partners from './partners';
import FilterPartners from './filter_partners';
import FilterArtworks from './filter_artworks';
import PartnerCategory from './partner_category';
import PartnerCategories from './partner_categories';
import PartnerShow from './partner_show';
import PartnerShows from './partner_shows';
import Sale from './sale/index';
import Sales from './sales';
import SaleArtwork from './sale_artwork';
import Search from './search';
import TrendingArtists from './trending';
import HomePageModules from './home_page_modules';
import Me from './me';
import JWT from './jwt';
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
      fairs: Fairs,
      gene: Gene,
      home_page_modules: HomePageModules,
      profile: Profile,
      ordered_sets: OrderedSets,
      partner: Partner,
      partners: Partners,
      filter_partners: FilterPartners,
      filter_artworks: FilterArtworks,
      partner_category: PartnerCategory,
      partner_categories: PartnerCategories,
      partner_show: PartnerShow,
      partner_shows: PartnerShows,
      sale: Sale,
      sales: Sales,
      sale_artwork: SaleArtwork,
      search: Search,
      trending_artists: TrendingArtists,
      me: Me,
      jwt: JWT,
    },
  }),
});

export default schema;
