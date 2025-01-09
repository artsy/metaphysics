import { connectionFromArraySlice } from "graphql-relay"
import { convertConnectionArgsToGravityArgs } from "lib/helpers"
import { createPageCursors } from "schema/v2/fields/pagination"
import { HomeViewSection } from "."
import { withHomeViewTimeout } from "../helpers/withHomeViewTimeout"
import { HomeViewSectionTypeNames } from "../sectionTypes/names"
import { ContextModule } from "@artsy/cohesion"

export const Tasks: HomeViewSection = {
  id: "home-view-section-tasks",
  type: HomeViewSectionTypeNames.HomeViewSectionTasks,
  contextModule: ContextModule.actNow,
  component: {
    title: "Act Now",
  },
  requiresAuthentication: true,
  resolver: withHomeViewTimeout(async (_parent, args, { meTasksLoader }) => {
    console.log("resolving tasks")
    if (!meTasksLoader) return null

    const { page, size, offset } = convertConnectionArgsToGravityArgs(args)

    const { body: results, headers } = await meTasksLoader({
      page,
      size,
      total_count: true,
    })

    const count = parseInt(headers["x-total-count"] || "0", 10)

    console.log("resolved tasks", { count })
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
