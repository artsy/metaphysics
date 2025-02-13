import { GraphQLBoolean, GraphQLFieldConfig } from "graphql"
import { connectionFromArraySlice } from "graphql-relay"
import { convertConnectionArgsToGravityArgs } from "lib/helpers"
import { filter, pick } from "lodash"
import moment from "moment"
import { pageable } from "relay-cursor-paging"
import { ResolverContext } from "types/graphql"
import { fairConnection } from "../fair"
import { createPageCursors } from "../fields/pagination"

const MAX_NUMBER_OF_FAIRS = 30

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
    const now = moment.utc()
    const { size, offset, page } = convertConnectionArgsToGravityArgs(args)

    const numberOfFairsToFetch = size + offset

    const gravityOptions = {
      has_full_feature: true,
      sort: "-start_at",
    }

    const { body: unfilteredRunningFairs } = await fairsLoader({
      ...gravityOptions,
      active: true,
      numberOfFairsToFetch,
    })

    // Gravity returns fairs that are both current and upcoming.
    // Make sure only the current ones appear in the results list.
    const runningFairs = filter(unfilteredRunningFairs, (fair) => {
      const startAt = moment.utc(fair.start_at)
      return now.isAfter(startAt)
    })

    let allFairs = runningFairs

    const backfillSize = numberOfFairsToFetch - runningFairs.length

    // If there are less than the number of fairs to fetch to get the current page, get the most recent closed fairs as backfill
    if (args.includeBackfill && backfillSize > 0) {
      const { body: unfilteredClosedFairs } = await fairsLoader({
        ...gravityOptions,
        status: "closed",
        active: false,
        size: backfillSize,
      })

      const closedFairs = filter(unfilteredClosedFairs, (fair) => {
        const endAt = moment.utc(fair.end_at)
        return now.isAfter(endAt)
      })

      allFairs = allFairs.concat(closedFairs)
    }

    // Setting `totalCount` to a fixed maximum number unless there are fewer fairs in total.
    const totalCount =
      allFairs.length < numberOfFairsToFetch
        ? allFairs.length
        : MAX_NUMBER_OF_FAIRS

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
