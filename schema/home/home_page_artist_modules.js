import { keys, map } from 'lodash';
import { HomePageArtistModuleType, Results } from './home_page_artist_module';
import {
  GraphQLList,
} from 'graphql';

const HomePageArtistModules = {
  type: new GraphQLList(HomePageArtistModuleType),
  description: 'Modules to show on the home screen',
  resolve: (root, params, { rootValue: { accessToken } }) => {
    return map(keys(Results), key => {
      return { key, display: true };
    });
  },
};

export default HomePageArtistModules;
