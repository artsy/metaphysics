import { GraphQLObjectType } from "graphql"
import { connectionFromArray } from "graphql-relay"
import { convertConnectionArgsToGravityArgs } from "lib/helpers"
import { pageable } from "relay-cursor-paging"
import { AlertType } from "schema/v2/Alerts"
import { artworkConnection } from "schema/v2/artwork"
import { createPageCursors } from "schema/v2/fields/pagination"
import { ResolverContext } from "types/graphql"

export const AlertNotificationItemType = new GraphQLObjectType<
  any,
  ResolverContext
>({
  name: "AlertNotificationItem",
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
