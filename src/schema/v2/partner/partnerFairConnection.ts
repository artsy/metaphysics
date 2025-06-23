import { GraphQLString, GraphQLInt } from "graphql"
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
      type: GraphQLString,
      description: "Search term for fairs",
    },
    page: {
      type: GraphQLInt,
    },
    size: {
      type: GraphQLInt,
    },
  }),
  resolve: async (_root, args, { matchFairsLoader }) => {
    if (!matchFairsLoader) {
      return null
    }

    const { page, size, offset } = convertConnectionArgsToGravityArgs(args)
    const gravityOptions = {
      size,
      offset,
      total_count: true,
      term: args.term,
    }
    const { body, headers } = await matchFairsLoader(gravityOptions)
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
