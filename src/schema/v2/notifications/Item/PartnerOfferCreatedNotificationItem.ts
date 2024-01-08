import { GraphQLObjectType, GraphQLString } from "graphql"
import { connectionFromArray } from "graphql-relay"
import { convertConnectionArgsToGravityArgs } from "lib/helpers"
import { pageable } from "relay-cursor-paging"
import { artworkConnection } from "schema/v2/artwork"
import { createPageCursors } from "schema/v2/fields/pagination"
import { ResolverContext } from "types/graphql"

export const PartnerOfferCreatedNotificationItemType = new GraphQLObjectType<
  any,
  ResolverContext
>({
  name: "PartnerOfferCreatedNotificationItem",
  fields: {
    artworksConnection: {
      type: artworkConnection.connectionType,
      args: pageable(),
      resolve: async (
        { object_ids },
        args,
        { artworksLoader, mePartnerOfferLoader }
      ) => {
        if (!mePartnerOfferLoader) return null
        // object_ids should include a single partner offer id
        if (object_ids.length === 0) return null

        const { artwork_id } = await mePartnerOfferLoader(object_ids[0])

        const { page, size } = convertConnectionArgsToGravityArgs(args)
        const body = await artworksLoader({ ids: [artwork_id] })
        const totalCount = body.length

        return {
          totalCount,
          pageCursors: createPageCursors({ page, size }, totalCount),
          ...connectionFromArray(body, args),
        }
      },
    },
    expires_at: {
      type: GraphQLString,
      resolve: async ({ object_ids }, _, { mePartnerOfferLoader }) => {
        if (!mePartnerOfferLoader) return null
        // object_ids should include a single partner offer id
        if (object_ids.length === 0) return null

        const { end_at } = await mePartnerOfferLoader(object_ids[0])

        return end_at
      },
    },
  },
})
