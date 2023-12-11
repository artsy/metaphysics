import { GraphQLObjectType } from "graphql"
import { connectionFromArray } from "graphql-relay"
import { convertConnectionArgsToGravityArgs } from "lib/helpers"
import { pageable } from "relay-cursor-paging"
import { createPageCursors } from "schema/v2/fields/pagination"
import { PartnerType } from "schema/v2/partner/partner"
import { ShowsConnection } from "schema/v2/show"
import { ResolverContext } from "types/graphql"

export const ShowOpenedNotificationItemType = new GraphQLObjectType<
  any,
  ResolverContext
>({
  name: "ShowOpenedNotificationItem",
  fields: {
    partner: {
      type: PartnerType,
      resolve: ({ actor_ids }, _args, { partnerLoader }) => {
        if (!actor_ids) return null

        const partnerID = actor_ids[0]

        return partnerLoader(partnerID)
      },
    },

    showsConnection: {
      type: ShowsConnection.connectionType,
      args: pageable(),
      resolve: async ({ object_ids }, args, { showsLoader }) => {
        const { page, size } = convertConnectionArgsToGravityArgs(args)

        const shows = await showsLoader({
          id: object_ids,
        })
        const totalCount = shows.length

        return {
          totalCount,
          pageCursors: createPageCursors({ page, size }, totalCount),
          ...connectionFromArray(shows, args),
        }
      },
    },
  },
})
