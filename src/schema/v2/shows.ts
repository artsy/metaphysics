import { GraphQLFieldConfig, GraphQLList, GraphQLString } from "graphql"
import { ResolverContext } from "types/graphql"
import { createPageCursors } from "./fields/pagination"
import { ShowsConnection } from "./show"
import { pageable } from "relay-cursor-paging"
import { convertConnectionArgsToGravityArgs } from "lib/helpers"
import { connectionFromArray } from "graphql-relay"

/**
 * Root field used (only) by Positron to fetch related content on articles
 */
export const Shows: GraphQLFieldConfig<void, ResolverContext> = {
  type: ShowsConnection.connectionType,
  description: "A list of Shows",
  args: pageable({
    ids: {
      type: new GraphQLList(GraphQLString),
    },
  }),
  resolve: (_root, { ..._options }, { showsLoader }) => {
    const { page, size } = convertConnectionArgsToGravityArgs(_options)
    const options: any = {
      id: _options.ids,
      page,
      size,
    }

    return showsLoader(options).then((body) => {
      const totalCount = body.length
      return {
        totalCount,
        pageCursors: createPageCursors({ page, size }, totalCount),
        ...connectionFromArray(body, options),
      }
    })
  },
}
