import _ from "lodash"
import FairSorts from "./sorts/fair_sorts"
import EventStatus from "./input_fields/event_status"
import Near from "./input_fields/near"
import Fair from "./fair"
import {
  GraphQLString,
  GraphQLList,
  GraphQLInt,
  GraphQLBoolean,
  GraphQLFieldConfig,
} from "graphql"
import { ResolverContext } from "types/graphql"

const Fairs: GraphQLFieldConfig<void, ResolverContext> = {
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
    ids: {
      type: new GraphQLList(GraphQLString),
      description: `
        Only return fairs matching specified ids.
        Accepts list of ids.
      `,
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
  resolve: async (_root, options, { fairsLoader }) => {
    let gravityOptions = options
    if (options.near) {
      gravityOptions = _.assign(options, {
        // eslint-disable-line no-param-reassign
        near: `${options.near.lat},${options.near.lng}`,
        max_distance: options.near.max_distance,
      })
    }
    if (options.ids) {
      gravityOptions.id = options.ids
      delete gravityOptions.ids
    }
    const { body: fairs } = await fairsLoader(gravityOptions)
    return fairs
  },
}

export default Fairs
