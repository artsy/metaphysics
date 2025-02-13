import { GraphQLBoolean, GraphQLFieldConfig } from "graphql"
import { convertConnectionArgsToGravityArgs } from "lib/helpers"
import { pageable } from "relay-cursor-paging"
import { ResolverContext } from "types/graphql"
import { fairConnection } from "../fair"
import { paginationResolver } from "../fields/pagination"

export const FeaturedFairsConnection: GraphQLFieldConfig<
  void,
  ResolverContext
> = {
  description:
    "A connection of currently running featured fairs, backfilled with past fairs. Fairs are sorted by start date in descending order.",
  type: fairConnection.connectionType,
  args: pageable({
    includeBackfill: { type: GraphQLBoolean, defaultValue: true },
  }),
  resolve: async (_root, args, { fairsLoader }) => {
    const { size, offset, page } = convertConnectionArgsToGravityArgs(args)

    const sharedOptions = {
      has_full_feature: true,
      sort: "-start_at",
      total_count: true,
    }

    const { body: runningFairs, headers } = await fairsLoader({
      ...sharedOptions,
      status: "running",
      // TODO: We could replace status: "running" with active: true (and add active: false to the backfill)
      // active: true,
      size,
      offset,
    })

    const runningFairsCount = parseInt(headers["x-total-count"] || "0", 10)

    let totalCount = runningFairsCount
    let allFairs = runningFairs

    // Backfill with closed fairs

    if (args.includeBackfill) {
      const { body: closedFairs, headers: backfillHeaders } = await fairsLoader(
        {
          ...sharedOptions,
          status: "closed",
          size: size - runningFairs.length,
          offset: runningFairs.length === 0 ? runningFairsCount : 0,
        }
      )

      allFairs = allFairs.concat(closedFairs)

      totalCount =
        totalCount + parseInt(backfillHeaders["x-total-count"] || "0", 10)
    }

    return paginationResolver({
      totalCount,
      offset,
      page,
      size,
      body: allFairs,
      args,
    })
  },
}
