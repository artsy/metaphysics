import {
  GraphQLBoolean,
  GraphQLFieldConfig,
  GraphQLID,
  GraphQLList,
  GraphQLNonNull,
} from "graphql"
import { ResolverContext } from "types/graphql"
import {
  connectionWithCursorInfo,
  paginationResolver,
} from "./fields/pagination"
import { ViewingRoomType } from "./viewingRoom"
import { pageable } from "relay-cursor-paging"
import { convertConnectionArgsToGravityArgs } from "lib/helpers"
import { ViewingRoomStatusEnum } from "./viewingRoomConnection"

const ViewingRoomConnectionType = connectionWithCursorInfo({
  name: "ViewingRoom",
  nodeType: ViewingRoomType,
})

export const ViewingRoomConnection: GraphQLFieldConfig<
  void,
  ResolverContext
> = {
  type: ViewingRoomConnectionType.connectionType,
  description: "(Deprecate) use viewingRoomsConnection",
  deprecationReason: "Use viewingRoomsConnection",
  args: pageable({
    featured: {
      type: GraphQLBoolean,
    },
    partnerID: {
      type: GraphQLID,
    },
    published: {
      type: GraphQLBoolean,
      description: "(Deprecated) Use statuses",
    },
    statuses: {
      type: new GraphQLList(new GraphQLNonNull(ViewingRoomStatusEnum)),
      defaultValue: ["live"],
      description: "Returns only viewing rooms with these statuses",
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
