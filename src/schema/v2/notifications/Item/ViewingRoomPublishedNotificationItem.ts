import { GraphQLList, GraphQLObjectType, GraphQLString } from "graphql"
import { PartnerType } from "schema/v2/partner/partner"
import { ResolverContext } from "types/graphql"

// Additionally, there is a `viewingRoomsConnection` field that is stitched in.
export const ViewingRoomPublishedNotificationItemType = new GraphQLObjectType<
  any,
  ResolverContext
>({
  name: "ViewingRoomPublishedNotificationItem",
  fields: {
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
  },
})
