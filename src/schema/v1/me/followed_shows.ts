import { ShowType } from "schema/v1/show"

import { pageable, getPagingParameters } from "relay-cursor-paging"
import { connectionDefinitions, connectionFromArraySlice } from "graphql-relay"
import { GraphQLFieldConfig, GraphQLString, GraphQLInt } from "graphql"
import { ResolverContext } from "types/graphql"
import EventStatus from "schema/v1/input_fields/event_status"
import cityData from "../city/cityDataSortedByDisplayPreference.json"
import { LOCAL_DISCOVERY_RADIUS_KM } from "../city/constants"

const location_by_city_slug = cityData.reduce((acc, val) => {
  acc[val.slug] = val.coordinates
  return acc
}, {})

const getValidCitySlugs = () => Object.keys(location_by_city_slug).join(", ")

export const FollowedShowConnection = connectionDefinitions({
  name: "FollowedShow",
  // This never ended up being used in the underlying lib.
  // edgeType: FollowedShowEdge,
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
      description: `A string representing one of the supported cities in the City Guide, which are: ${getValidCitySlugs()}`,
    },
  }),
  description: "A list of the current user’s currently followed shows",
  resolve: (_root, options, { followedShowsLoader }) => {
    if (!followedShowsLoader) return null

    let locationArgs = {}
    if (options.city) {
      const location = location_by_city_slug[options.city]

      if (!location) {
        throw new Error(`City slug must be one of: ${getValidCitySlugs()}`)
      }

      locationArgs = {
        near: `${location.lat},${location.lng}`,
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
        // @ts-ignore
        resolveNode: (follow_show) => follow_show.partner_show,
      })
    })
  },
}

export default FollowedShows
