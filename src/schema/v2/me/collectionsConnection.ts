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
  GraphQLString,
} from "graphql"
import { ResolverContext } from "types/graphql"

export const CollectionsConnectionType = connectionWithCursorInfo({
  name: "Collections",
  nodeType: CollectionType,
}).connectionType

export const CollectionSorts = new GraphQLEnumType({
  name: "CollectionSorts",
  values: {
    CREATED_AT_ASC: {
      value: "created_at",
    },
    CREATED_AT_DESC: {
      value: "-created_at",
    },
    UPDATED_AT_ASC: {
      value: "updated_at",
    },
    UPDATED_AT_DESC: {
      value: "-updated_at",
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
    includesArtworkID: { type: GraphQLString },
  }),
  resolve: async (_parent, args, context, _info) => {
    const { collectionsLoader, userID } = context
    if (!collectionsLoader) return null

    const { page, size, offset } = convertConnectionArgsToGravityArgs(args)

    const { body, headers } = await collectionsLoader({
      user_id: userID,
      private: true,
      default: args.default,
      saves: args.saves,
      sort: args.sort,
      size,
      offset,
      total_count: true,
      artwork_id: args.includesArtworkID,
    })
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
