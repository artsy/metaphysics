import { GraphQLString, GraphQLInt, GraphQLNonNull, GraphQLList } from "graphql"
import { ResolverContext } from "types/graphql"
import {
  connectionWithCursorInfo,
  paginationResolver,
} from "schema/v2/fields/pagination"
import { GraphQLFieldConfig } from "graphql"
import { pageable } from "relay-cursor-paging"
import { convertConnectionArgsToGravityArgs } from "lib/helpers"
import { FairType } from "schema/v2/fair"

export const PartnerFairConnection: GraphQLFieldConfig<
  void,
  ResolverContext
> = {
  type: connectionWithCursorInfo({
    name: "PartnerFair",
    nodeType: FairType,
  }).connectionType,
  description: "Retrieve partner fairs for search",
  args: pageable({
    term: {
      type: new GraphQLNonNull(GraphQLString),
      description: "Your search term",
    },
    page: {
      type: GraphQLInt,
      description: "Page to retrieve. Default: 1.",
    },
    size: {
      type: GraphQLInt,
      description: "Maximum number of items to retrieve. Default: 5.",
    },
    excludeIDs: {
      type: new GraphQLList(GraphQLString),
      description: "Exclude these MongoDB ids from results",
    },
  }),
  resolve: async (
    _root,
    { excludeIDs, term, ...args },
    { matchFairsLoader }
  ) => {
    if (!matchFairsLoader) {
      return null
    }
    console.log(excludeIDs, term, args)

    const { page, size, offset } = convertConnectionArgsToGravityArgs(args)
    const gravityArgs: {
      page: number
      size: number
      total_count: boolean
      term?: string
      id?: string[]
    } = { page, size, term, total_count: true }
    const { body, headers } = await matchFairsLoader(gravityArgs)
    const totalCount = parseInt(headers["x-total-count"] || "0", 10)

    return paginationResolver({
      totalCount,
      offset,
      page,
      size,
      body,
      args,
    })
  },
}
