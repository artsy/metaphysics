import {
  keys,
  map,
} from 'lodash';
import {
  HomePageArtistModuleType,
  Results,
} from './home_page_artist_module';
import {
  GraphQLList,
} from 'graphql';

const HomePageArtistModules = {
  type: new GraphQLList(HomePageArtistModuleType),
  description: 'Modules to show on the home screen',
  resolve: () => map(keys(Results), key => ({ key })),
};

export default HomePageArtistModules;
