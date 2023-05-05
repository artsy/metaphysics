import { GraphQLBoolean, GraphQLFieldConfig } from "graphql"
import { getPagingParameters, pageable } from "relay-cursor-paging"
import { ResolverContext } from "types/graphql"
import EventStatus from "../input_fields/event_status"
import ShowSorts from "../sorts/show_sorts"
import { ShowsConnection as ShowsConnectionType } from "../show"
import { paginationResolver } from "../fields/pagination"
import Near from "../input_fields/near"

const DEFAULT_MAX_DISTANCE = 75

interface Location {
  lat: number
  lng: number
  maxDistance?: number
}

export const ShowsConnection: GraphQLFieldConfig<void, ResolverContext> = {
  type: ShowsConnectionType.connectionType,
  args: pageable({
    includeShowsByLocation: {
      type: GraphQLBoolean,
      defaultValue: false,
      description:
        "Include shows near to the user's location (falls back to IP-based location if `near` param is not provided)",
    },
    near: {
      type: Near,
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
  resolve: async (
    _root,
    args,
    { meShowsLoader, requestLocationLoader, requestIP }
  ) => {
    if (!meShowsLoader) return null

    const { limit: size, offset } = getPagingParameters(args)
    const { page, sort, status } = args

    const locationArgs = args.includeShowsByLocation
      ? await getLocationArgs(args.near, requestIP, requestLocationLoader)
      : {}

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
  near: Location,
  requestIP: string | undefined,
  requestLocationLoader: any
) => {
  let location: Location | undefined

  // Fetch location by IP if it's not provided as an argument
  if (near) {
    location = near
  } else {
    const {
      body: { data: locationData },
    } = await requestLocationLoader({ ip: requestIP })

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
    max_distance: location.maxDistance || DEFAULT_MAX_DISTANCE,
  }
}
