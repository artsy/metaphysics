import { paginationResolver } from "schema/v2/fields/pagination"
import { convertConnectionArgsToGravityArgs } from "lib/helpers"
import { OrderBuyerStateEnum } from "./types/sharedOrderTypes"
import { pageable } from "relay-cursor-paging"
import {
  GraphQLFieldConfig,
  GraphQLInt,
  GraphQLList,
  GraphQLString,
} from "graphql"
import { ResolverContext } from "types/graphql"
import { MeOrdersConnectionType } from "./types/OrderType"

export const MeOrdersConnection: GraphQLFieldConfig<any, ResolverContext> = {
  type: MeOrdersConnectionType,
  args: pageable({
    page: { type: GraphQLInt },
    size: { type: GraphQLInt },
    artworkID: {
      type: GraphQLString,
      description: "Filter by artwork ID in line items",
    },
    editionSetID: {
      type: GraphQLString,
      description:
        "Filter by edition set ID in line items (requires artworkID)",
    },
    buyerState: {
      type: new GraphQLList(OrderBuyerStateEnum),
      description: "Filter by buyer states",
    },
  }),
  resolve: async (_parent, args, context, _info) => {
    const { meOrdersLoader } = context
    if (!meOrdersLoader) return null

    const { page, size, offset } = convertConnectionArgsToGravityArgs(args)

    const params: Record<string, any> = {
      page,
      size,
    }

    if (args.editionSetID) {
      if (!args.artworkID) {
        throw new Error("editionSetID requires an arg for artworkID")
      }
      params.edition_set_id = args.editionSetID
    }

    if (args.artworkID) {
      params.artwork_id = args.artworkID
    }

    if (args.buyerState && args.buyerState.length > 0) {
      params.buyer_state = args.buyerState.join(",")
    }

    const response = await meOrdersLoader(params)

    const { body, headers } = response
    const totalCount = parseInt((headers ?? {})["x-total-count"] || "0", 10)

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
