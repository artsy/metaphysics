import config from "config"
import { GraphQLList, GraphQLObjectType, GraphQLString } from "graphql"
import { convertConnectionArgsToGravityArgs } from "lib/helpers"
import { pageable } from "relay-cursor-paging"
import { paginationResolver } from "schema/v2/fields/pagination"
import { PartnerType } from "schema/v2/partner/partner"
import { ViewingRoomsConnection } from "schema/v2/viewingRoomConnection"
import { ResolverContext } from "types/graphql"

// Additionally, there is a `viewingRoomsConnection` field that is stitched in.
export const ViewingRoomPublishedNotificationItemType = new GraphQLObjectType<
  any,
  ResolverContext
>({
  name: "ViewingRoomPublishedNotificationItem",
  fields: () => {
    return {
      partner: {
        type: PartnerType,
        resolve: ({ actor_ids }, _args, { partnerLoader }) => {
          if (!actor_ids) return null

          const partnerID = actor_ids[0]

          return partnerLoader(partnerID)
        },
      },

      viewingRoomIDs: {
        type: new GraphQLList(GraphQLString),
        description: "The IDs of the viewing rooms, for use in stitching",
        resolve: ({ object_ids }) => {
          return object_ids
        },
      },

      ...(config.USE_UNSTITCHED_VIEWING_ROOM_SCHEMA && {
        viewingRoomsConnection: {
          type: ViewingRoomsConnection.type,
          args: pageable(),
          resolve: async (
            { object_ids: viewing_room_ids },
            args,
            { viewingRoomsLoader }
          ) => {
            if (!viewing_room_ids || viewing_room_ids.length === 0) {
              return null
            }

            const { page, size, offset } = convertConnectionArgsToGravityArgs(
              args
            )

            const gravityArgs = {
              ids: viewing_room_ids,
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
        },
      }),
    }
  },
})
