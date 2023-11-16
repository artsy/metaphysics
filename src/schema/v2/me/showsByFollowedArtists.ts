import { GraphQLFieldConfig } from "graphql"
import { connectionFromArraySlice } from "graphql-relay"
import { getPagingParameters, pageable } from "relay-cursor-paging"
import { ResolverContext } from "types/graphql"
import EventStatus from "../input_fields/event_status"
import { ShowsConnection } from "../show"
import ShowSorts from "../sorts/show_sorts"

export const ShowsByFollowedArtists: GraphQLFieldConfig<
  void,
  ResolverContext
> = {
  type: ShowsConnection.connectionType,
  args: pageable({
    sort: {
      type: ShowSorts,
      defaultValue: "CREATED_AT_DESC",
    },
    status: {
      type: EventStatus.type,
      defaultValue: "CURRENT",
      description: "Filter shows by chronological event status",
    },
  }),
  description: "A list of shows by followed artists",
  resolve: async (_root, options, { followedArtistsShowsLoader }) => {
    if (!followedArtistsShowsLoader) return null

    const { limit: size, offset } = getPagingParameters(options)
    const { sort, status } = options

    const gravityArgs = {
      size,
      offset,
      total_count: true,
      sort,
      status,
    }

    const { body: shows, headers } = await followedArtistsShowsLoader(
      gravityArgs
    )

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
