import HomePageModules from './home_page_modules';
import HomePageModule from './home_page_module';

import {
  GraphQLObjectType,
} from 'graphql';

const HomePageType = new GraphQLObjectType({
  name: 'HomePage',
  fields: {
    modules: HomePageModules,
    module: HomePageModule,
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
