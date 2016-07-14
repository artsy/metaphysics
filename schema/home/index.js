import HomePageModules from './home_page_modules';
import HomePageModule from './home_page_module';
import HomePageArtistModule from './home_page_artist_module';
import HomePageArtistModules from './home_page_artist_modules';

import {
  GraphQLObjectType,
} from 'graphql';

const HomePageType = new GraphQLObjectType({
  name: 'HomePage',
  fields: {
    modules: HomePageModules,
    module: HomePageModule,
    artist_module: HomePageArtistModule,
    artist_modules: HomePageArtistModules,
  },
});

const HomePage = {
  type: HomePageType,
  description: 'Home screen content',
  resolve: () => {
    // dummy response object, otherwise the nested fields won’t work
    return {};
  },
};

export default HomePage;
