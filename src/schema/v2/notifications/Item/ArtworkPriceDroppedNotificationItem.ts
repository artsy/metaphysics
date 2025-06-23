import {
  GraphQLInt,
  GraphQLList,
  GraphQLNonNull,
  GraphQLObjectType,
  GraphQLString,
} from "graphql"
import { connectionFromArray } from "graphql-relay"
import { convertConnectionArgsToGravityArgs } from "lib/helpers"
import { pageable } from "relay-cursor-paging"
import { AlertType } from "schema/v2/Alerts"
import { ArtworkType } from "schema/v2/artwork"
import {
  connectionWithCursorInfo,
  createPageCursors,
} from "schema/v2/fields/pagination"
import { ResolverContext } from "types/graphql"

// TODO: move to another file
const PriceDropType = new GraphQLObjectType<any, ResolverContext>({
  name: "PriceDrop",
  fields: {
    artwork: {
      type: new GraphQLNonNull(ArtworkType),
    },
    oldPrice: {
      type: new GraphQLNonNull(GraphQLInt),
      resolve: ({ old_price }) => old_price,
    },
    newPrice: {
      type: new GraphQLNonNull(GraphQLInt),
      resolve: ({ new_price }) => new_price,
    },
  },
})

// TODO: move to another file
export const PriceDropsConnection = connectionWithCursorInfo({
  nodeType: PriceDropType,
})

export const ArtworkPriceDroppedNotificationItemType = new GraphQLObjectType<
  any,
  ResolverContext
>({
  name: "ArtworkPriceDroppedNotificationItem",
  fields: {
    alert: {
      type: AlertType,
      resolve: ({ actor_ids }, _args, { meSearchCriteriaLoader }) => {
        if (!meSearchCriteriaLoader) {
          throw new Error("You need to be signed in to perform this action")
        }

        if (!actor_ids) return null

        const searchCriteriaID = actor_ids[0]

        return meSearchCriteriaLoader(searchCriteriaID)
      },
    },

    priceDropsConnection: {
      type: PriceDropsConnection.connectionType,
      args: pageable({
        ids: {
          type: new GraphQLList(new GraphQLNonNull(GraphQLString)),
        },
      }),
      resolve: async ({ object_ids }, args, { artworkPriceDropsLoader }) => {
        const { page, size } = convertConnectionArgsToGravityArgs(args)
        const body = await artworkPriceDropsLoader({ ids: object_ids })

        console.log("[Debug] body", body)

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
