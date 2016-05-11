import gravity from '../../lib/loaders/gravity';
import {
  keys,
  map,
  filter,
} from 'lodash';
import Results from './results';
import Title from './title';
import Context from './context';
import {
  GraphQLList,
  GraphQLObjectType,
  GraphQLString,
} from 'graphql';

export const HomePageModulesType = new GraphQLObjectType({
  name: 'HomePageModules',
  fields: () => ({
    key: {
      type: GraphQLString,
    },
    display: {
      type: GraphQLString,
    },
    context: Context,
    title: Title,
    results: Results,
  }),
});

const HomePageModules = {
  type: new GraphQLList(HomePageModulesType),
  description: 'Modules to show on the home screen',
  args: {
    include_keys: {
      type: new GraphQLList(GraphQLString),
      description: 'A list of modules to return (by key)',
      defaultValue: false,
    },
  },
  resolve: (root, { include_keys }, { rootValue: { accessToken } }) => {
    if (include_keys && include_keys.length > 0) {
      return map(include_keys, (key) => {
        return { key, display: true };
      });
    }
    return gravity.with(accessToken)('me/modules').then((response) => {
      const modules = map(keys(response), (key) => {
        return { key, display: response[key] };
      });
      return filter(modules, ['display', true]);
    });
  },
};

export default HomePageModules;
