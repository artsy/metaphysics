import { GraphQLFieldConfig, GraphQLInt } from "graphql"
import { pageable } from "relay-cursor-paging"
import {
  CatchCollectionNotFoundException,
  convertConnectionArgsToGravityArgs,
} from "lib/helpers"
import {
  connectionWithCursorInfo,
  paginationResolver,
} from "schema/v2/fields/pagination"
import { ResolverContext } from "types/graphql"
import { ResaleSubmissionType } from "./resaleSubmission"

export const ResaleSubmissionsConnectionType = connectionWithCursorInfo({
  nodeType: ResaleSubmissionType,
}).connectionType

export const ResaleSubmissionsConnection: GraphQLFieldConfig<
  void,
  ResolverContext
> = {
  type: ResaleSubmissionsConnectionType,
  description: "The current user's resale submissions",
  args: pageable({
    page: { type: GraphQLInt },
    size: { type: GraphQLInt },
  }),
  resolve: async (_root, args, { resaleSubmissionsLoader }) => {
    if (!resaleSubmissionsLoader) return null

    const { page, size, offset } = convertConnectionArgsToGravityArgs(args)

    try {
      const { body, headers } = await resaleSubmissionsLoader({
        page,
        size,
        offset,
        total_count: true,
      })
      const totalCount = parseInt(headers["x-total-count"] || "0", 10)

      return paginationResolver({ totalCount, offset, page, size, body, args })
    } catch (error) {
      return CatchCollectionNotFoundException(error)
    }
  },
}
