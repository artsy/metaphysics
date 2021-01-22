import { ShowType } from "schema/v2/show"

import { pageable, getPagingParameters } from "relay-cursor-paging"
import { connectionDefinitions, connectionFromArraySlice } from "graphql-relay"
import { GraphQLFieldConfig, GraphQLString, GraphQLInt } from "graphql"
import { ResolverContext } from "types/graphql"
import EventStatus from "schema/v2/input_fields/event_status"
import { LOCAL_DISCOVERY_RADIUS_KM } from "../city/constants"

export const FollowedShowConnection = connectionDefinitions({
  name: "FollowedShow",
  nodeType: ShowType,
})

const FollowedShows: GraphQLFieldConfig<void, ResolverContext> = {
  type: FollowedShowConnection.connectionType,
  args: pageable({
    status: EventStatus,
    dayThreshold: {
      type: GraphQLInt,
      description:
        "Number of days which will be used to filter upcoming and closing soon shows",
    },
    city: {
      type: GraphQLString,
      description: `A string representing one of the supported cities`,
    },
  }),
  description: "A list of the current user’s currently followed shows",
  resolve: async (
    _root,
    options,
    { followedShowsLoader, geodataCitiesLoader }
  ) => {
    if (!followedShowsLoader) return null

    let locationArgs = {}
    if (options.city) {
      const allCities = await geodataCitiesLoader()
      const location = allCities.find((city) => city.slug === options.city)

      if (!location) {
        throw new Error(`Cannot find valid city`)
      }

      locationArgs = {
        near: location.coords.join(","),
        max_distance: LOCAL_DISCOVERY_RADIUS_KM,
      }
    }

    const { limit: size, offset } = getPagingParameters(options)
    const gravityArgs = {
      size,
      offset,
      total_count: true,
      sort: options.sort,
      status: options.status,
      day_threshold: options.dayThreshold,
      ...locationArgs,
    }

    return followedShowsLoader(gravityArgs).then(({ body, headers }) => {
      return connectionFromArraySlice(body, options, {
        arrayLength: parseInt(headers["x-total-count"] || "0", 10),
        sliceStart: offset,
        resolveNode: (follow_show) => follow_show.partner_show,
      })
    })
  },
}

export default FollowedShows
