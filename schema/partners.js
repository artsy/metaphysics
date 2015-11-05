import gravity from '../lib/loaders/gravity';
import Partner from './partner';
import {
  GraphQLString,
  GraphQLList
} from 'graphql'

let Partners = {
  type: new GraphQLList(Partner.type),
  description: 'A list of Partners',
  args: {
    near: {
      type: GraphQLString,
      description: 'Coordinates to find partners closest to'
    }
  },
  resolve: (root, options) => gravity('partners', options)
};

export default Partners;
