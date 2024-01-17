import { GraphQLBoolean, GraphQLObjectType } from "graphql"
import { connectionFromArray } from "graphql-relay"
import { convertConnectionArgsToGravityArgs } from "lib/helpers"
import { pageable } from "relay-cursor-paging"
import { artworkConnection } from "schema/v2/artwork"
import { date } from "schema/v2/fields/date"
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
      resolve: async ({ object_ids }, args, { artworksLoader }) => {
        const { page, size } = convertConnectionArgsToGravityArgs(args)
        const body = await artworksLoader({ ids: object_ids })
        const totalCount = body.length

        return {
          totalCount,
          pageCursors: createPageCursors({ page, size }, totalCount),
          ...connectionFromArray(body, args),
        }
      },
    },
    available: {
      type: GraphQLBoolean,
      description: "Whether or not the offer is still available",
      resolve: async ({ actor_ids }, _, { mePartnerOfferLoader }) => {
        if (!mePartnerOfferLoader) return null
        if (actor_ids.length === 0) return null

        const { available } = await mePartnerOfferLoader(actor_ids[0])
        return available
      },
    },
    expiresAt: {
      ...date(({ date }) => date),
      resolve: async ({ actor_ids }, _, { mePartnerOfferLoader }) => {
        if (!mePartnerOfferLoader) return null
        if (actor_ids.length === 0) return null

        const { end_at } = await mePartnerOfferLoader(actor_ids[0])

        return end_at
      },
    },
  },
})
