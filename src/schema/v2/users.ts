import { GraphQLFieldConfig, GraphQLList, GraphQLString } from "graphql"
import { ResolverContext } from "types/graphql"
import { paginationResolver } from "schema/v2/fields/pagination"
import { UsersConnection } from "./user"
import { pageable } from "relay-cursor-paging"
import { convertConnectionArgsToGravityArgs } from "lib/helpers"

export const Users: GraphQLFieldConfig<void, ResolverContext> = {
  type: UsersConnection.connectionType,
  description: "A list of Users",
  args: pageable({
    ids: {
      type: new GraphQLList(GraphQLString),
    },
    term: {
      type: GraphQLString,
      description:
        "If present, will search by term, cannot be combined with `ids`",
    },
  }),
  resolve: async (_root, args, { usersLoader, matchUsersLoader }) => {
    const { ids, term } = args

    if (ids && term) throw new Error("Must provide either `ids` or `term`")

    if (!usersLoader || !matchUsersLoader)
      throw new Error(
        "You need to pass a X-Access-Token header to perform this action"
      )

    const { page, size, offset } = convertConnectionArgsToGravityArgs(args)

    const loader = term ? matchUsersLoader : usersLoader
    const gravityArgs: {
      page: number
      size: number
      total_count: boolean
      term?: string
      id?: string[]
    } = { page, size, total_count: true }

    if (term) gravityArgs.term = term
    if (ids) gravityArgs.id = ids
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
