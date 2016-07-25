import {
  find,
  has,
} from 'lodash';
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

export function createHomePageArtworkModule(moduleTypeName) {
  const type = new GraphQLObjectType({
    name: moduleTypeName,
    interfaces: [NodeInterface],
    isTypeOf: (obj) => has(obj, 'key') && has(obj, 'display'),
    fields: () => ({
      __id: {
        type: new GraphQLNonNull(GraphQLID),
        description: 'A globally unique ID.',
        resolve: ({ key, params }) => {
          // Compose this ID from params that `resolve` uses to identify a rail later on.
          const payload = { key };
          if (params) {
            payload.id = params.id;
          }
          return toGlobalId(moduleTypeName, JSON.stringify(payload));
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

  const mod = {
    type,
    description: 'Single artwork module to show on the home screen',
    args: {
      key: {
        type: GraphQLString,
        description: 'Module key',
      },
      id: {
        type: GraphQLString,
        description: 'ID of generic gene rail to target',
        deprecationReason: 'Favor more specific `generic_gene_id`',
      },
      generic_gene_id: {
        type: GraphQLString,
        description: 'ID of generic gene rail to target',
        deprecationReason: 'Favor more specific `generic_gene_id`',
      },
      followed_artist_id: {
        type: GraphQLString,
        description: 'ID of followed artist to target for related artist rails',
      },
      related_artist_id: {
        type: GraphQLString,
        description: 'ID of related artist to target for related artist rails',
      },
    },
    resolve: (root, { key, id, followed_artist_id, related_artist_id }) => {
      // is id a generic gene?
      let params = find(genericGenes, ['id', id]);
      if (params) {
        return { key, params, display: true };
      }
      if (followed_artist_id && related_artist_id) {
        params = { followed_artist_id, related_artist_id };
        return { key, params, display: true };
      }
      return { key, display: true };
    },
  };

  return mod;
}

const HomePageArtworkModule = createHomePageArtworkModule('HomePageArtworkModule');
export default HomePageArtworkModule;
