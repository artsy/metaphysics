import { GraphQLEnumType, GraphQLFieldConfig } from "graphql"
import { convertConnectionArgsToGravityArgs } from "lib/helpers"
import { pageable } from "relay-cursor-paging"
import { ResolverContext } from "types/graphql"
import {
  connectionWithCursorInfo,
  paginationResolver,
} from "../../fields/pagination"
import { ResaleSubmissionType } from "./resaleSubmission"

const GRAVITY_DEFAULT_PAGE_SIZE = 10

export const ResaleSubmissionSortsEnum = new GraphQLEnumType({
  name: "ResaleSubmissionSorts",
  values: {
    CREATED_AT_ASC: { value: "created_at" },
    CREATED_AT_DESC: { value: "-created_at" },
    UPDATED_AT_ASC: { value: "updated_at" },
    UPDATED_AT_DESC: { value: "-updated_at" },
  },
})

export const ResaleSubmissionConnectionType = connectionWithCursorInfo({
  nodeType: ResaleSubmissionType,
}).connectionType

export const ResaleSubmissionsConnection: GraphQLFieldConfig<
  void,
  ResolverContext
> = {
  type: ResaleSubmissionConnectionType,
  description: "The current user’s resale submissions.",
  args: pageable({
    sort: {
      type: ResaleSubmissionSortsEnum,
      description: "Newest first when omitted.",
    },
  }),
  resolve: async (_root, args, { meResaleSubmissionsLoader }) => {
    if (!meResaleSubmissionsLoader) {
      throw new Error("You need to be signed in to perform this action")
    }

    const pagingArgs = {
      ...args,
      first: args.first ?? GRAVITY_DEFAULT_PAGE_SIZE,
    }
    const { page, size, offset, sort } = convertConnectionArgsToGravityArgs(
      pagingArgs
    )

    const gravityParams = sort
      ? { page, size, sort, total_count: true }
      : { page, size, total_count: true }

    const { body, headers } = await meResaleSubmissionsLoader(gravityParams)
    const totalCount = parseInt((headers ?? {})["x-total-count"] || "0", 10)

    return paginationResolver({
      args: pagingArgs,
      body,
      offset,
      page,
      size,
      totalCount,
    })
  },
}
