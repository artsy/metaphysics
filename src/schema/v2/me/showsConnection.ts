import { GraphQLFieldConfig } from "graphql"
import { getPagingParameters, pageable } from "relay-cursor-paging"
import { ResolverContext } from "types/graphql"
import EventStatus from "../input_fields/event_status"
import ShowSorts from "../sorts/show_sorts"
import { ShowsConnection as ShowsConnectionType } from "../show"
import { paginationResolver } from "../fields/pagination"

export const ShowsConnection: GraphQLFieldConfig<void, ResolverContext> = {
  type: ShowsConnectionType.connectionType,
  args: pageable({
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
  resolve: async (_root, args, { meShowsLoader }) => {
    if (!meShowsLoader) return null

    const { limit: size, offset } = getPagingParameters(args)
    const { page, sort, status } = args

    const gravityArgs = {
      size,
      offset,
      total_count: true,
      sort,
      status,
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
