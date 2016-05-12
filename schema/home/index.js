import gravity from '../../lib/loaders/gravity';
import {
  keys,
  map,
  filter,
  slice,
} from 'lodash';
import {
  GraphQLList,
  GraphQLObjectType,
  GraphQLString,
  GraphQLInt,
} from 'graphql';
import loggedOutModules from './logged_out_modules';
import addGenericGenes from './add_generic_genes';
import { featuredFair, featuredAuction } from './fetch';
import Results from './results';
import Title from './title';
import Context from './context';
import Params from './params';

export const HomePageModulesType = new GraphQLObjectType({
  name: 'HomePageModules',
  fields: () => ({
    key: {
      type: GraphQLString,
    },
    display: {
      type: GraphQLString,
    },
    params: Params,
    context: Context,
    title: Title,
    results: Results,
  }),
});

const filteredModules = (modules, max_rails) => {
  return slice(
    addGenericGenes(filter(modules, ['display', true])),
  0, max_rails);
};

const HomePageModules = {
  type: new GraphQLList(HomePageModulesType),
  description: 'Modules to show on the home screen',
  args: {
    include_keys: {
      type: new GraphQLList(GraphQLString),
      description: 'A list of modules to return (by key)',
      defaultValue: false,
    },
    max_rails: {
      type: GraphQLInt,
      description: 'Maximum number of modules to return',
      defaultValue: 8,
    },
  },
  resolve: (root, { include_keys, max_rails }, { rootValue: { accessToken } }) => {
    // optional whitelist modules
    if (include_keys && include_keys.length > 0) {
      return map(include_keys, (key) => {
        return { key, display: true };
      });
    }
    // if user is logged in, get their modules
    if (accessToken) {
      return gravity.with(accessToken)('me/modules').then((response) => {
        const modules = map(keys(response), (key) => {
          return { key, display: response[key] };
        });
        return filteredModules(modules, max_rails);
      });
    }
    // otherwise, get the generic set of modules
    return Promise.all([
      featuredAuction(),
      featuredFair(),
    ]).then(([auction, fair]) => {
      const modules = loggedOutModules(auction, fair);
      return filteredModules(modules, max_rails);
    });
  },
};

export default HomePageModules;
