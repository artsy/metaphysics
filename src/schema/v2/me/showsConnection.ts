import { GraphQLFieldConfig, GraphQLString } from "graphql"
import { getPagingParameters, pageable } from "relay-cursor-paging"
import { ResolverContext } from "types/graphql"
import EventStatus from "../input_fields/event_status"
import ShowSorts from "../sorts/show_sorts"
import { ShowsConnection as ShowsConnectionType } from "../show"
import { paginationResolver } from "../fields/pagination"
import Near from "../input_fields/near"

const DEFAULT_MAX_DISTANCE_KM = 75

interface Location {
  lat: number
  lng: number
  maxDistance?: number
}

export const ShowsConnection: GraphQLFieldConfig<void, ResolverContext> = {
  type: ShowsConnectionType.connectionType,
  args: pageable({
    near: {
      type: Near,
    },
    ip: {
      type: GraphQLString,
      description: "An IP address, will be used to lookup location",
    },
    sort: {
      type: ShowSorts,
      defaultValue: "-created_at",
    },
    status: {
      type: EventStatus.type,
      defaultValue: "current",
      description: "Filter shows by chronological event status",
    },
  }),
  description:
    "A list of shows for the user (pagination logic might be broken)",
  resolve: async (_root, args, { meShowsLoader, requestLocationLoader }) => {
    if (!meShowsLoader) return null

    const { limit: size, offset } = getPagingParameters(args)
    const { near, ip, page, sort, status } = args

    if (ip && near) {
      throw new Error('The "ip" and "near" arguments are mutually exclusive.')
    }

    const locationArgs = await getLocationArgs(near, ip, requestLocationLoader)

    const gravityArgs = {
      size,
      offset,
      total_count: true,
      sort,
      status,
      ...locationArgs,
    }

    const { body, headers } = await meShowsLoader(gravityArgs)

    const totalCount = parseInt(headers["x-total-count"] || "0", 10)

    return paginationResolver({
      args,
      body,
      offset,
      page,
      size,
      totalCount,
    })
  },
}

const getLocationArgs = async (
  near: Location | undefined,
  ip: string | undefined,
  requestLocationLoader: any
) => {
  let location = near

  if (ip) {
    const {
      body: { data: locationData },
    } = await requestLocationLoader({ ip })

    if (locationData.location) {
      location = {
        lat: locationData.location.latitude,
        lng: locationData.location.longitude,
      }
    }
  }

  if (!location) return {}

  return {
    near: `${location.lat},${location.lng}`,
    max_distance: location.maxDistance || DEFAULT_MAX_DISTANCE_KM,
  }
}
