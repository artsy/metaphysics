import { GraphQLString, GraphQLNonNull, GraphQLList } from "graphql"
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
  { id: string },
  ResolverContext
> = {
  type: connectionWithCursorInfo({
    name: "PartnerFair",
    nodeType: FairType,
  }).connectionType,
  description: "A connection of fairs for a partner.",
  args: pageable({
    term: {
      type: new GraphQLNonNull(GraphQLString),
      description: "Your search term",
    },
    excludeIDs: {
      type: new GraphQLList(GraphQLString),
      description: "Exclude these MongoDB ids from results",
    },
  }),
  resolve: async (_, args, { matchFairsLoader }) => {
    if (!matchFairsLoader) return null

    const { page, size, offset } = convertConnectionArgsToGravityArgs(args)

    const { body, headers } = await matchFairsLoader({
      page,
      size,
      total_count: true,
      term: args.term,
      exclude_ids: args.excludeIDs,
    })

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
