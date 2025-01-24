import { GraphQLObjectType } from "graphql"
import { connectionFromArray } from "graphql-relay"
import { convertConnectionArgsToGravityArgs } from "lib/helpers"
import { pageable } from "relay-cursor-paging"
import { artworkConnection, ArtworkType } from "schema/v2/artwork"
import { createPageCursors } from "schema/v2/fields/pagination"
import { ResolverContext } from "types/graphql"

export const SavedArtworkChangesNotificationItemType = new GraphQLObjectType<
  any,
  ResolverContext
>({
  name: "SavedArtworkChangesNotificationItem",
  fields: {
    artwork: {
      type: ArtworkType,
      resolve: ({ actor_ids }, _args, { artworkLoader }) => {
        if (!actor_ids) return null

        const artworkId = actor_ids[0]

        return artworkLoader(artworkId)
      },
    },

    // TODO: maybe we don't need this field
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
