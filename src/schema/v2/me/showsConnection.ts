import { GraphQLBoolean, GraphQLFieldConfig, GraphQLString } from "graphql"
import { getLocationArgs } from "lib/locationHelpers"
import { getPagingParameters, pageable } from "relay-cursor-paging"
import { ResolverContext } from "types/graphql"
import { paginationResolver } from "../fields/pagination"
import EventStatus, { EventStatusEnums } from "../input_fields/event_status"
import Near from "../input_fields/near"
import { ShowsConnection as ShowsConnectionType } from "../show"
import ShowSorts from "../sorts/show_sorts"

export const ShowsConnection: GraphQLFieldConfig<void, ResolverContext> = {
  type: ShowsConnectionType.connectionType,
  args: pageable({
    near: {
      type: Near,
      description: "Include shows within a radius of the provided location",
    },
    includeShowsNearIpBasedLocation: {
      type: GraphQLBoolean,
      defaultValue: false,
      description:
        "Include shows near the user's location based on the IP address",
    },
    ip: {
      type: GraphQLString,
      description:
        "When set, this IP address will be used to look up the location, instead of the request's IP address.",
    },
    sort: {
      type: ShowSorts,
      defaultValue: ShowSorts.getValue("CREATED_AT_DESC")?.value,
    },
    status: {
      type: EventStatus.type,
      defaultValue: EventStatusEnums.getValue("CURRENT")?.value,
      description: "Filter shows by chronological event status",
    },
  }),
  description:
    "A list of shows for the user (pagination logic might be broken)",
  resolve: async (
    _root,
    args,
    { ipAddress, meShowsLoader, requestLocationLoader }
  ) => {
    if (!meShowsLoader) return null

    const { limit: size, offset } = getPagingParameters(args)
    const {
      near,
      includeShowsNearIpBasedLocation,
      ip,
      page,
      sort,
      status,
    } = args

    if (near && (includeShowsNearIpBasedLocation || ip)) {
      throw new Error(
        'The "includeShowsNearIpBasedLocation" and "near" arguments are mutually exclusive.'
      )
    }

    // Include shows by IP either if `includeShowsNearIpBasedLocation` is set to true or `ip` is passed as an argument
    // TODO: Only include shows by IP if `includeShowsNearIpBasedLocation` is set to true.
    const userIP = ip || (includeShowsNearIpBasedLocation && ipAddress) || null

    const locationArgs = await getLocationArgs({
      near,
      ip: userIP,
      requestLocationLoader,
    })

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
