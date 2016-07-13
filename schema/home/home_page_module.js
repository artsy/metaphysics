import { find } from 'lodash';
import { params as genericGenes } from './add_generic_genes';
import Results from './results';
import Title from './title';
import Context from './context';
import Params from './params';
import { NodeInterface } from '../object_identification';
import { toGlobalId } from 'graphql-relay';
import {
  GraphQLObjectType,
  GraphQLString,
  GraphQLBoolean,
  GraphQLID,
  GraphQLNonNull,
} from 'graphql';

export const HomePageModulesType = new GraphQLObjectType({
  name: 'HomePageModules',
  interfaces: [NodeInterface],
  fields: () => ({
    __id: {
      type: new GraphQLNonNull(GraphQLID),
      description: 'A globally unique ID.',
      resolve: (obj) => {
        // Compose this ID from params that `resolve` uses to identify a rail later on.
        const payload = { key: obj.key };
        if (obj.params) {
          payload.id = obj.params.id;
        }
        return toGlobalId('HomePageModules', JSON.stringify(payload));
      },
    },
    key: {
      type: GraphQLString,
    },
    display: {
      type: GraphQLString,
      deprecationReason: 'Favor `is_`-prefixed Booleans (*and* this should be a Boolean)',
    },
    is_displayable: {
      type: GraphQLBoolean,
      resolve: ({ display }) => display,
    },
    params: Params,
    context: Context,
    title: Title,
    results: Results,
  }),
});

const HomePageModule = {
  type: HomePageModulesType,
  description: 'Single module to show on the home screen',
  args: {
    key: {
      type: GraphQLString,
      description: 'Module key',
    },
    id: {
      type: GraphQLString,
      description: 'ID of generic gene rail to target',
    },
  },
  resolve: (root, { key, id }) => {
    // is id a generic gene?
    const params = find(genericGenes, ['id', id]);
    if (params) {
      return { key, params, display: true };
    }
    return { key, display: true };
  },
  // ObjectIdentification
  isType: (obj) => obj.hasOwnProperty('key') && obj.hasOwnProperty('display'),
};

export default HomePageModule;
