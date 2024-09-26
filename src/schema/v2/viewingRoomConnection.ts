import {
  GraphQLBoolean,
  GraphQLEnumType,
  GraphQLFieldConfig,
  GraphQLList,
  GraphQLString,
} from "graphql"
import { ResolverContext } from "types/graphql"
import {
  connectionWithCursorInfo,
  paginationResolver,
} from "./fields/pagination"
import { ViewingRoomType } from "./viewingRoom"
import { pageable } from "relay-cursor-paging"
import { convertConnectionArgsToGravityArgs } from "lib/helpers"

export const ViewingRoomStatusEnum = new GraphQLEnumType({
  name: "ViewingRoomStatusEnum",
  values: {
    closed: {
      value: "closed",
    },
    draft: {
      value: "draft",
    },
    live: {
      value: "live",
    },
    scheduled: {
      value: "scheduled",
    },
  },
})

const ViewingRoomsConnectionType = connectionWithCursorInfo({
  name: "ViewingRooms",
  nodeType: ViewingRoomType,
})

export const ViewingRoomsConnection: GraphQLFieldConfig<
  void,
  ResolverContext
> = {
  type: ViewingRoomsConnectionType.connectionType,
  args: pageable({
    ids: {
      type: new GraphQLList(GraphQLString),
    },
    featured: {
      type: GraphQLBoolean,
    },
    partnerID: {
      type: GraphQLString,
    },
    statuses: {
      type: new GraphQLList(ViewingRoomStatusEnum),
    },
  }),
  resolve: async (_root, args, { viewingRoomsLoader }) => {
    // TODO: Currently clients do not specify `first` and expect 20 viewing rooms in response.
    //       This should be removed once clients are updated.
    if (!args.first) {
      args.first = 20
    }

    const { page, size, offset } = convertConnectionArgsToGravityArgs(args)

    const gravityArgs = {
      ids: args.ids,
      partner_id: args.partnerID,
      featured: args.featured,
      statuses: args.statuses,
      page,
      size,
      total_count: true,
    }

    const { body, headers } = await viewingRoomsLoader(gravityArgs)

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
