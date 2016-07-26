import {
  filter,
  map,
} from 'lodash';
import {
  HomePageArtistModuleType,
  HomePageArtistModuleTypes,
} from './home_page_artist_module';
import {
  GraphQLList,
} from 'graphql';

const HomePageArtistModules = {
  type: new GraphQLList(HomePageArtistModuleType),
  description: 'Artist modules to show on the home screen',
  resolve: (root, params, { rootValue: { accessToken, userID } }) => {
    // First check each type if they can display…
    return Promise.all(map(HomePageArtistModuleTypes, (type, key) => {
      return type.display(accessToken, userID).then(displayable => ({ key, displayable }));
    })).then(results => {
      // …then reduce list to those that can be displayed.
      return map(filter(results, 'displayable'), ({ key }) => ({ key }));
    });
  },
};

export default HomePageArtistModules;
