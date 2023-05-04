import { GraphQLFieldConfig } from "graphql"
import { getPagingParameters, pageable } from "relay-cursor-paging"
import { ResolverContext } from "types/graphql"
import { connectionFromArraySlice } from "graphql-relay"
import EventStatus from "../input_fields/event_status"
import ShowSorts from "../sorts/show_sorts"
import { ShowsConnection } from "../show"

export const ShowRecommendations: GraphQLFieldConfig<void, ResolverContext> = {
  type: ShowsConnection.connectionType,
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
  description: "A list of recommended shows for the user",
  resolve: async (_root, options, { meShowsLoader }) => {
    if (!meShowsLoader) return null

    const { limit: size, offset } = getPagingParameters(options)
    const { sort, status } = options

    const gravityArgs = {
      size,
      offset,
      total_count: true,
      sort,
      status,
    }

    const { body: shows, headers } = await meShowsLoader(gravityArgs)

    const count = parseInt(headers["x-total-count"] || "0", 10)

    return {
      totalCount: count,
      ...connectionFromArraySlice(shows, options, {
        arrayLength: count,
        sliceStart: offset,
      }),
    }
  },
}
