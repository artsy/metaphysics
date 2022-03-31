import { GraphQLFieldConfig, GraphQLList, GraphQLString } from "graphql"
import { ResolverContext } from "types/graphql"
import { paginationResolver } from "./fields/pagination"
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
  }),
  resolve: async (_root, args, { usersLoader }) => {
    if (!usersLoader) return null
    const { page, size, offset } = convertConnectionArgsToGravityArgs(args)

    const { body, headers } = await usersLoader({
      id: args.ids,
      total_count: true,
      page,
      size,
    })

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
