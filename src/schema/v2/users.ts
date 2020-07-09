import { GraphQLFieldConfig, GraphQLList, GraphQLString } from "graphql"
import { ResolverContext } from "types/graphql"
import { createPageCursors } from "./fields/pagination"
import { UsersConnection } from "./user"
import { pageable } from "relay-cursor-paging"
import { convertConnectionArgsToGravityArgs } from "lib/helpers"
import { connectionFromArray } from "graphql-relay"

/**
 * Root field used (only) by Positron to fetch users (authors) on articles
 */
export const Users: GraphQLFieldConfig<void, ResolverContext> = {
  type: UsersConnection.connectionType,
  description: "A list of Users",
  args: pageable({
    ids: {
      type: new GraphQLList(GraphQLString),
    },
  }),
  resolve: (_root, { ..._options }, { usersLoader }) => {
    if (!usersLoader) return null
    const { page, size } = convertConnectionArgsToGravityArgs(_options)
    const options: any = {
      id: _options.ids,
      page,
      size,
    }

    return usersLoader(options).then((body) => {
      const totalCount = body.length
      return {
        totalCount,
        pageCursors: createPageCursors({ page, size }, totalCount),
        ...connectionFromArray(body, options),
      }
    })
  },
}
