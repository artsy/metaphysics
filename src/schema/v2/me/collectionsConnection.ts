import {
  connectionWithCursorInfo,
  paginationResolver,
} from "schema/v2/fields/pagination"
import { convertConnectionArgsToGravityArgs } from "lib/helpers"
import { CollectionType } from "./collection"
import { pageable } from "relay-cursor-paging"
import { GraphQLBoolean, GraphQLFieldConfig, GraphQLInt } from "graphql"
import { ResolverContext } from "types/graphql"

export const CollectionsConnectionType = connectionWithCursorInfo({
  name: "Collections",
  nodeType: CollectionType,
}).connectionType

export const CollectionsConnection: GraphQLFieldConfig<any, ResolverContext> = {
  type: CollectionsConnectionType,
  args: pageable({
    page: { type: GraphQLInt },
    size: { type: GraphQLInt },
    default: { type: GraphQLBoolean },
    saves: { type: GraphQLBoolean },
  }),
  resolve: async (parent, args, context, _info) => {
    const { id: meID } = parent
    const { collectionsLoader } = context
    if (!collectionsLoader) return null

    const { page, size, offset } = convertConnectionArgsToGravityArgs(args)
    const { default: default_, saves } = args // 'default' is a reserved word in JS

    const { body, headers } = await collectionsLoader({
      user_id: meID,
      private: true,
      default: default_,
      saves,
      size,
      offset,
      total_count: true,
    })
    const bodyWithMe = (body ?? []).map((obj) => {
      return { ...obj, userID: meID }
    })
    const totalCount = parseInt((headers ?? {})["x-total-count"] || "0", 10)

    return paginationResolver({
      totalCount,
      offset,
      page,
      size,
      body: bodyWithMe,
      args,
    })
  },
}
