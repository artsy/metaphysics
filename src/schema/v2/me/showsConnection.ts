import { GraphQLFieldConfig, GraphQLString } from "graphql"
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
