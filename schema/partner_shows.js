import _ from 'lodash';
import gravity from '../lib/loaders/gravity';
import PartnerShowSorts from './sorts/partner_show_sorts';
import EventStatus from './fields/event_status';
import PartnerShow from './partner_show';
import {
  GraphQLString,
  GraphQLList,
  GraphQLInt,
  GraphQLBoolean,
  GraphQLEnumType
} from 'graphql'

let PartnerShows = {
  type: new GraphQLList(PartnerShow.type),
  description: 'A list of PartnerShows',
  args: {
    size: {
      type: GraphQLInt
    },
    sort: PartnerShowSorts,
    status: EventStatus,
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
  resolve: (root, options) => gravity('shows', _.defaults(options, {
    displayable: true
  }))
};

export default PartnerShows;
