import _ from "lodash"
import gravity from "lib/loaders/gravity"
import PartnerShowSorts from "./sorts/partner_show_sorts"
import EventStatus from "./input_fields/event_status"
import Near from "./input_fields/near"
import PartnerShow from "./partner_show"
import { GraphQLString, GraphQLList, GraphQLInt, GraphQLBoolean } from "graphql"

const PartnerShows = {
  type: new GraphQLList(PartnerShow.type),
  description: "A list of PartnerShows",
  args: {
    at_a_fair: {
      type: GraphQLBoolean,
    },
    displayable: {
      type: GraphQLBoolean,
      defaultValue: true,
    },
    fair_id: {
      type: GraphQLString,
    },
    featured: {
      type: GraphQLBoolean,
    },
    near: {
      type: Near,
    },
    partner_id: {
      type: GraphQLString,
    },
    size: {
      type: GraphQLInt,
    },
    sort: PartnerShowSorts,
    status: EventStatus,
  },
  resolve: (root, options) => {
    let gravityOptions = options
    if (options.near) {
      gravityOptions = _.assign(options, {
        // eslint-disable-line no-param-reassign
        near: `${options.near.lat},${options.near.lng}`,
        max_distance: options.near.max_distance,
      })
    }
    return gravity("shows", gravityOptions)
  },
}

export default PartnerShows
