import { GraphQLObjectType, GraphQLNonNull, GraphQLList } from "graphql"
import { connectionFromArray } from "graphql-relay"
import { convertConnectionArgsToGravityArgs } from "lib/helpers"
import { pageable } from "relay-cursor-paging"
import { ArtistType } from "schema/v2/artist"
import { artworkConnection } from "schema/v2/artwork"
import { createPageCursors } from "schema/v2/fields/pagination"
import { ResolverContext } from "types/graphql"

export const ArtworkPublishedNotificationItemType = new GraphQLObjectType<
  any,
  ResolverContext
>({
  name: "ArtworkPublishedNotificationItem",
  fields: {
    artists: {
      type: new GraphQLNonNull(new GraphQLList(new GraphQLNonNull(ArtistType))),
      resolve: async ({ actor_ids }, _args, { artistsLoader }) => {
        if (!actor_ids) return []

        const { body } = await artistsLoader({ ids: actor_ids })
        return body ?? []
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
