import { GraphQLBoolean, GraphQLFieldConfig, GraphQLString } from "graphql"
import { getLocationArgs } from "lib/locationHelpers"
import { getPagingParameters, pageable } from "relay-cursor-paging"
import { ResolverContext } from "types/graphql"
import { paginationResolver } from "../fields/pagination"
import EventStatus from "../input_fields/event_status"
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

    if (ip && near) {
      throw new Error('The "ip" and "near" arguments are mutually exclusive.')
    }

    // Inlcude shows by IP either if `includeShowsNearIpBasedLocation` is set to true or `ip` is passed as an argument
    const userIP = ip || (includeShowsNearIpBasedLocation && ipAddress) || null

    const locationArgs = await getLocationArgs(
      near,
      userIP,
      requestLocationLoader
    )

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
