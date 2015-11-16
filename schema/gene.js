import gravity from '../lib/loaders/gravity';
import cached from './fields/cached';
import Image from './image';
import {
  GraphQLObjectType,
  GraphQLString
} from 'graphql';

let GeneType = new GraphQLObjectType({
  name: 'Gene',
  fields: {
    cached: cached,
    id: {
      type: GraphQLString
    },
    name: {
      type: GraphQLString
    },
    image: {
      type: Image.type,
      resolve: (gene) => gene
    }
  }
});

let Gene = {
  type: GeneType,
  resolve: ({ id }) => gravity(`gene/${id}`)
};

export default Gene;
