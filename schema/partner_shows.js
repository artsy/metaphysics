import gravity from '../lib/loaders/gravity';
import PartnerShow from './partner_show';
import {
  GraphQLString,
  GraphQLList,
  GraphQLInt,
  GraphQLBoolean
} from 'graphql'

let PartnerShows = {
  type: new GraphQLList(PartnerShow.type),
  description: 'A list of PartnerShows',
  args: {
    size: {
      type: GraphQLInt
    },
    sort: {
      type: GraphQLString
    },
    displayable: {
      type: GraphQLBoolean
    },
    status: {
      type: GraphQLString
    },
    fair_id: {
      type: GraphQLString
    },
    partner_id: {
      type: GraphQLString
    },
    near: {
      type: GraphQLString,
      description: 'Coordinates to find shows closest to'
    }
  },
  resolve: (root, options) => gravity('shows', options)
};

export default PartnerShows;
