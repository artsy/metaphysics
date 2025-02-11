import { GraphQLBoolean, GraphQLFieldConfig, GraphQLNonNull } from "graphql"
import { connectionFromArraySlice } from "graphql-relay"
import { convertConnectionArgsToGravityArgs } from "lib/helpers"
import { filter, pick } from "lodash"
import moment from "moment"
import { pageable } from "relay-cursor-paging"
import { ResolverContext } from "types/graphql"
import { fairConnection } from "../fair"
import { createPageCursors } from "../fields/pagination"

export const FeaturedFairsConnection: GraphQLFieldConfig<
  void,
  ResolverContext
> = {
  description:
    "A connection of featured currently running fairs, backfilled with past fairs. Fairs are sorted by start_at in descending order.",
  type: fairConnection.connectionType,
  args: pageable({
    includeBackfill: { type: new GraphQLNonNull(GraphQLBoolean) },
  }),
  resolve: async (_root, args, { fairsLoader }) => {
    const { size, offset, page } = convertConnectionArgsToGravityArgs(args)

    const numberOfRairsToFetch = size + offset

    // Check for all fairs that are currently running
    const gravityOptions = {
      has_full_feature: true,
      sort: "-start_at",
      active: true,
    }

    const now = moment.utc()

    const { body: unfilteredRunningFairs } = await fairsLoader(gravityOptions)

    // Gravity returns fairs that are both current and upcoming.
    // Make sure only the current ones appear in the results list.
    const runningFairs = filter(unfilteredRunningFairs, (fair) => {
      const startAt = moment.utc(fair.start_at)
      return now.isAfter(startAt)
    })

    let allFairs = runningFairs

    // If there are less than the number of fairs to fetch to get the current page, get the most recent closed fairs
    if (args.includeBackfill && runningFairs.length < numberOfRairsToFetch) {
      const newOptions = {
        ...gravityOptions,
        status: "closed",
        active: false,
        size: numberOfRairsToFetch - runningFairs.length,
      }

      const { body: unfilteredClosedFairs } = await fairsLoader(newOptions)

      const closedFairs = filter(unfilteredClosedFairs, (fair) => {
        const endAt = moment.utc(fair.end_at)
        return now.isAfter(endAt)
      })

      allFairs = allFairs.concat(closedFairs)
    }

    const totalCount = allFairs.length

    return {
      totalCount,
      pageCursors: createPageCursors({ page, size }, totalCount),
      ...connectionFromArraySlice(
        allFairs,
        pick(args, "before", "after", "first", "last"),
        {
          arrayLength: totalCount,
          sliceStart: offset,
        }
      ),
    }
  },
}
