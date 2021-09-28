import { GraphQLFieldConfig } from "graphql"
import { getPagingParameters, pageable } from "relay-cursor-paging"
import { ResolverContext } from "types/graphql"
import { connectionFromArraySlice } from "graphql-relay"
import EventStatus from "../input_fields/event_status"
import ShowSorts from "../sorts/show_sorts"
import { ShowsConnection } from "../show"

export const ShowsByFollowedArtists: GraphQLFieldConfig<
  void,
  ResolverContext
> = {
  type: ShowsConnection.connectionType,
  args: pageable({
    sort: {
      type: ShowSorts,
    },
    status: {
      type: EventStatus.type,
      defaultValue: "current",
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
