import _ from "lodash"
import gravity from "lib/loaders/gravity"
import FairSorts from "./sorts/fair_sorts"
import EventStatus from "./input_fields/event_status"
import Near from "./input_fields/near"
import Fair from "./fair"
import { GraphQLString, GraphQLList, GraphQLInt, GraphQLBoolean } from "graphql"

const Fairs = {
  type: new GraphQLList(Fair.type),
  description: "A list of Fairs",
  args: {
    fair_organizer_id: {
      type: GraphQLString,
    },
    has_full_feature: {
      type: GraphQLBoolean,
    },
    has_homepage_section: {
      type: GraphQLBoolean,
    },
    has_listing: {
      type: GraphQLBoolean,
    },
    near: {
      type: Near,
    },
    page: {
      type: GraphQLInt,
    },
    size: {
      type: GraphQLInt,
    },
    sort: FairSorts,
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
    return gravity("fairs", gravityOptions)
  },
}

export default Fairs
