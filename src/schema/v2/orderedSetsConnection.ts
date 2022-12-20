import { GraphQLFieldConfig, GraphQLString } from "graphql"
import { ResolverContext } from "types/graphql"
import { paginationResolver } from "schema/v2/fields/pagination"
import { pageable } from "relay-cursor-paging"
import { convertConnectionArgsToGravityArgs } from "lib/helpers"
import { OrderedSetConnection } from "./OrderedSet"

export const OrderedSetsConnection: GraphQLFieldConfig<
  void,
  ResolverContext
> = {
  type: OrderedSetConnection.connectionType,
  description: "A list of Ordered Sets",
  args: pageable({
    term: {
      type: GraphQLString,
      description: "If present, will search by term",
    },
  }),
  resolve: async (_root, args, { matchSetsLoader, setsLoader }) => {
    if (!matchSetsLoader)
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

    // NOTE: api/v1/match/sets doesn't currently support pagination
    const loader = term ? matchSetsLoader : setsLoader

    const { body } = await loader(gravityArgs)

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
