import { GraphQLFieldConfig, GraphQLString } from "graphql"
import { convertConnectionArgsToGravityArgs } from "lib/helpers"
import { pageable } from "relay-cursor-paging"
import { ResolverContext } from "types/graphql"
import { paginationResolver } from "schema/v2/fields/pagination"
import { PageConnectionType } from "./Page"

export const PagesConnection: GraphQLFieldConfig<void, ResolverContext> = {
  type: PageConnectionType,
  args: pageable({
    term: {
      type: GraphQLString,
      description: "If present, will search by term",
    },
  }),
  resolve: async (_root, args, { pagesLoader, matchPagesLoader }) => {
    if (!pagesLoader || !matchPagesLoader)
      throw new Error(
        "You need to pass a X-Access-Token header to perform this action"
      )

    const { term } = args
    const { page, size, offset } = convertConnectionArgsToGravityArgs(args)

    const gravityArgs: {
      page: number
      size: number
      total_count: boolean
      term?: string
    } = {
      page,
      size,
      total_count: true,
    }

    if (term) gravityArgs.term = term

    const loader = term ? matchPagesLoader : pagesLoader

    const { body, headers } = await loader(gravityArgs)

    const totalCount = parseInt(headers["x-total-count"] || "0", 10)

    return paginationResolver({
      args,
      body,
      offset,
      page,
      size,
      totalCount,
    })
  },
}
