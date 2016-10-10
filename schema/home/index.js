/* @flow */

import {
  GraphQLObjectType,
} from 'graphql';

import HomePageArtworkModule from './home_page_artwork_module';
import HomePageArtworkModules from './home_page_artwork_modules';
import HomePageArtistModule from './home_page_artist_module';
import HomePageArtistModules from './home_page_artist_modules';

const HomePageType = new GraphQLObjectType({
  name: 'HomePage',
  fields: {
    artwork_module: HomePageArtworkModule,
    artwork_modules: HomePageArtworkModules,
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
