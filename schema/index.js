import Status from './status';
import Article from './article';
import Articles from './articles';
import Artwork from './artwork';
import Artworks from './artworks';
import Artist from './artist';
import Artists from './artists';
import ExternalPartner from './external_partner';
import Fair from './fair';
import Fairs from './fairs';
import Gene from './gene';
import HomePage from './home';
import OrderedSets from './ordered_sets';
import Profile from './profile';
import Partner from './partner';
import Partners from './partners';
import FilterPartners from './filter_partners';
import filterArtworks from './filter_artworks';
import PartnerCategory from './partner_category';
import PartnerCategories from './partner_categories';
import PartnerShow from './partner_show';
import PartnerShows from './partner_shows';
import Sale from './sale/index';
import Sales from './sales';
import SaleArtwork from './sale_artwork';
import Search from './search';
import Show from './show';
import TrendingArtists from './trending';
import Me from './me';
import CausalityJWT from './causality_jwt';
import Viewer from './viewer';
import ObjectIdentification from './object_identification';
import {
  GraphQLSchema,
  GraphQLObjectType,
} from 'graphql';

const schema = new GraphQLSchema({
  query: new GraphQLObjectType({
    name: 'RootQueryType',
    fields: {
      article: Article,
      articles: Articles,
      artwork: Artwork,
      artworks: Artworks,
      artist: Artist,
      artists: Artists,
      causality_jwt: CausalityJWT,
      external_partner: ExternalPartner,
      fair: Fair,
      fairs: Fairs,
      filter_partners: FilterPartners,
      filter_artworks: filterArtworks(),
      gene: Gene,
      home_page: HomePage,
      me: Me,
      node: ObjectIdentification.NodeField,
      ordered_sets: OrderedSets,
      partner: Partner,
      partner_categories: PartnerCategories,
      partner_category: PartnerCategory,
      partner_show: PartnerShow,
      partner_shows: PartnerShows,
      partners: Partners,
      profile: Profile,
      sale: Sale,
      sale_artwork: SaleArtwork,
      sales: Sales,
      search: Search,
      show: Show,
      status: Status,
      trending_artists: TrendingArtists,
      viewer: Viewer,
    },
  }),
});

export default schema;
