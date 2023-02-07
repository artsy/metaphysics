import {
  connectionWithCursorInfo,
  paginationResolver,
} from "schema/v2/fields/pagination"
import { convertConnectionArgsToGravityArgs } from "lib/helpers"
import { CollectionType } from "./collection"
import { pageable } from "relay-cursor-paging"
import {
  GraphQLBoolean,
  GraphQLEnumType,
  GraphQLFieldConfig,
  GraphQLInt,
} from "graphql"
import { ResolverContext } from "types/graphql"

export const CollectionsConnectionType = connectionWithCursorInfo({
  name: "Collections",
  nodeType: CollectionType,
}).connectionType

const CollectionSorts = new GraphQLEnumType({
  name: "CollectionSorts",
  values: {
    CREATED_AT_ASC: {
      value: "created_at",
    },
    CREATED_AT_DESC: {
      value: "-created_at",
    },
  },
})

export const CollectionsConnection: GraphQLFieldConfig<any, ResolverContext> = {
  type: CollectionsConnectionType,
  args: pageable({
    page: { type: GraphQLInt },
    size: { type: GraphQLInt },
    default: { type: GraphQLBoolean },
    saves: { type: GraphQLBoolean },
    sort: { type: CollectionSorts },
  }),
  resolve: async (parent, args, context, _info) => {
    const { id: meID } = parent
    const { collectionsLoader } = context
    if (!collectionsLoader) return null

    const { page, size, offset } = convertConnectionArgsToGravityArgs(args)

    const { body, headers } = await collectionsLoader({
      user_id: meID,
      private: true,
      default: args.default,
      saves: args.saves,
      sort: args.sort,
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
