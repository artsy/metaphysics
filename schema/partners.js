import gravity from '../lib/loaders/gravity';
import Partner from './partner';
import {
  GraphQLString,
  GraphQLList,
  GraphQLNonNull
} from 'graphql'

let Partners = {
  type: new GraphQLList(Partner.type),
  description: 'A list of Partners',
  args: {
    ids: {
      type: new GraphQLNonNull(new GraphQLList(GraphQLString)),
      description: 'The slug or ID of the Partner'
    }
  },
  resolve: (root, { ids }) => Promise.all(ids.map(id => gravity(`partner/${id}`)))
};

export default Partners;
