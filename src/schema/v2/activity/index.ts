import activityEventContent from "./data.json"

import { GraphQLFieldConfig } from "graphql"
import { connectionFromArraySlice } from "graphql-relay"
import { pick } from "lodash"
import { pageable } from "relay-cursor-paging"
import {
  connectionWithCursorInfo,
  createPageCursors,
} from "schema/v2/fields/pagination"
import { ResolverContext } from "types/graphql"
import { ActivityEventType } from "../activityEvent"

export const ActivityConnection: GraphQLFieldConfig<void, ResolverContext> = {
  type: connectionWithCursorInfo({ nodeType: ActivityEventType })
    .connectionType,
  description: "A list of Partners",
  args: pageable(),
  resolve: async (_root, args) => {
    // const options = convertConnectionArgsToGravityArgs(args)

    const body = activityEventContent
    const totalCount = body.length

    return {
      totalCount,
      pageCursors: createPageCursors(
        { page: args.page, size: args.size },
        totalCount
      ),
      ...connectionFromArraySlice(
        body,
        pick(args, "before", "after", "first", "last"),
        {
          sliceStart: 0,
          arrayLength: totalCount,
        }
      ),
    }
  },
}
