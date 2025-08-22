import { GraphQLFieldConfig } from "graphql"
import { ResolverContext } from "types/graphql"
import { pageable } from "relay-cursor-paging"
import { UserAddressType } from "./userAddress"
import { convertConnectionArgsToGravityArgs } from "lib/helpers"
import {
  connectionWithCursorInfo,
  paginationResolver,
} from "../../fields/pagination"

export const UserAddressConnectionType = connectionWithCursorInfo({
  nodeType: UserAddressType,
}).connectionType

export const UserAddressesConnection: GraphQLFieldConfig<
  void,
  ResolverContext
> = {
  type: UserAddressConnectionType,
  args: pageable(),
  resolve: async (_parent, args, { meUserAddressesLoader }) => {
    if (!meUserAddressesLoader) {
      throw new Error("You need to be signed in to perform this action")
    }
    if (!args.first) {
      args.first = 20 // TODO: Remove this once clients are updated
    }

    const { page, size, offset } = convertConnectionArgsToGravityArgs(args)

    const { body, headers } = await meUserAddressesLoader({
      page,
      size,
      total_count: true,
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
