import _ from 'lodash';
import gravity from '../lib/loaders/gravity';
import PartnerShowSorts from './sorts/partner_show_sorts';
import EventStatus from './input_fields/event_status';
import Near from './input_fields/near';
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
      type: Near
    },
    displayable: {
      type: GraphQLBoolean,
      defaultValue: true
    },
    featured: {
      type: GraphQLBoolean
    }
  },
  resolve: (root, options) => {
    if (options.near) {
      options = _.assign(options, {
        near: `${options.near.lat},${options.near.lng}`,
        max_distance: options.near.max_distance
      });
    }
    return gravity('shows', options);
  }
};

export default PartnerShows;
