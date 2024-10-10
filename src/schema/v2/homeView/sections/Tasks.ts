import { connectionFromArraySlice } from "graphql-relay"
import { convertConnectionArgsToGravityArgs } from "lib/helpers"
import { createPageCursors } from "schema/v2/fields/pagination"
import { HomeViewSection } from "."
import { withHomeViewTimeout } from "../helpers/withHomeViewTimeout"
import { HomeViewSectionTypeNames } from "../sectionTypes/names"

export const Tasks: HomeViewSection = {
  id: "home-view-section-tasks",
  type: HomeViewSectionTypeNames.HomeViewSectionTasks,
  // TODO: Create context module in Cohesion
  // contextModule: ContextModule.tasks,
  component: {
    title: "Notifications",
  },
  requiresAuthentication: true,
  resolver: withHomeViewTimeout(async (_parent, args, { meTasksLoader }) => {
    if (!meTasksLoader) return null

    const { page, size, offset } = convertConnectionArgsToGravityArgs(args)

    const { body: results, headers } = await meTasksLoader({
      page,
      size,
      total_count: true,
    })

    const count = parseInt(headers["x-total-count"] || "0", 10)

    return {
      totalCount: count,
      pageCursors: createPageCursors({ ...args, page, size }, count),
      ...connectionFromArraySlice(results, args, {
        arrayLength: count,
        sliceStart: offset,
      }),
    }
  }),
}
