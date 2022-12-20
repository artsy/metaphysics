import { GraphQLFieldConfig, GraphQLNonNull, GraphQLString } from "graphql"
import { ResolverContext } from "types/graphql"
import { paginationResolver } from "schema/v2/fields/pagination"
import { pageable } from "relay-cursor-paging"
import { convertConnectionArgsToGravityArgs } from "lib/helpers"
import { OrderedSetConnection } from "../OrderedSet"

export const MatchOrderedSetsConnection: GraphQLFieldConfig<
  void,
  ResolverContext
> = {
  type: OrderedSetConnection.connectionType,
  description: "A list of Ordered Sets",
  args: pageable({
    term: {
      type: new GraphQLNonNull(GraphQLString),
      description:
        "If present, will search by term, cannot be combined with `ids`",
    },
  }),
  resolve: async (_root, args, { matchSetsLoader }) => {
    if (!matchSetsLoader)
      throw new Error(
        "You need to pass a X-Access-Token header to perform this action"
      )

    const { term } = args

    const { page, size, offset } = convertConnectionArgsToGravityArgs(args)

    const { body } = await matchSetsLoader({
      term,
      page,
      size,
      total_count: true,
    })

    const totalCount = body.length

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
