import { GraphQLObjectType } from "graphql"
import { connectionFromArray } from "graphql-relay"
import { convertConnectionArgsToGravityArgs } from "lib/helpers"
import { pageable } from "relay-cursor-paging"
import { ArticleType } from "schema/v2/article"
import { artistConnection } from "schema/v2/artist"
import { createPageCursors } from "schema/v2/fields/pagination"
import { ResolverContext } from "types/graphql"

export const ArticleFeaturedArtistNotificationItemType = new GraphQLObjectType<
  any,
  ResolverContext
>({
  name: "ArticleFeaturedArtistNotificationItem",
  fields: {
    article: {
      type: ArticleType,
      resolve: ({ actor_ids }, _args, { articleLoader }) => {
        if (!actor_ids) return null

        const articleID = actor_ids[0]

        return articleLoader(articleID)
      },
    },

    artistsConnection: {
      type: artistConnection.connectionType,
      args: pageable(),
      resolve: async ({ object_ids }, args, { artistsLoader }) => {
        const { page, size } = convertConnectionArgsToGravityArgs(args)

        const { body: artists } = await artistsLoader({
          ids: object_ids,
        })
        const totalCount = artists.length

        return {
          totalCount,
          pageCursors: createPageCursors({ page, size }, totalCount),
          ...connectionFromArray(artists, args),
        }
      },
    },
  },
})
