import { GraphQLObjectType } from "graphql"
import { connectionFromArray } from "graphql-relay"
import { convertConnectionArgsToGravityArgs } from "lib/helpers"
import { pageable } from "relay-cursor-paging"
import { artworkConnection } from "schema/v2/artwork"
import { createPageCursors } from "schema/v2/fields/pagination"
import { MarketingCollectionType } from "schema/v2/marketingCollections"
import { ResolverContext } from "types/graphql"

export const MarketingCollectionHitNotificationItemType = new GraphQLObjectType<
  any,
  ResolverContext
>({
  name: "MarketingCollectionHitNotificationItem",
  fields: {
    marketingCollection: {
      type: MarketingCollectionType,
      resolve: ({ actor_ids }, _args, { marketingCollectionLoader }) => {
        if (!marketingCollectionLoader) {
          throw new Error("You need to be signed in to perform this action")
        }

        if (!actor_ids) return null

        const collectionID = actor_ids[0]

        return marketingCollectionLoader(collectionID)
      },
    },

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
  },
})
