import { GraphQLInt, GraphQLNonNull, GraphQLObjectType } from "graphql"
import { connectionFromArray } from "graphql-relay"
import { pageable } from "relay-cursor-paging"
import { convertConnectionArgsToGravityArgs } from "lib/helpers"
import { artworkConnection } from "schema/v2/artwork"
import { createPageCursors, emptyConnection } from "schema/v2/fields/pagination"
import { ResolverContext } from "types/graphql"

export const ArticleSectionArtworkGrid = new GraphQLObjectType<
  any,
  ResolverContext
>({
  name: "ArticleSectionArtworkGrid",
  isTypeOf: (section) => {
    return section.type === "artwork_grid"
  },
  fields: () => ({
    columns: {
      type: new GraphQLNonNull(GraphQLInt),
      description: "Number of columns the grid renders (2, 3, or 4)",
      resolve: ({ columns }) => columns,
    },
    artworksConnection: {
      type: artworkConnection.connectionType,
      args: pageable({}),
      description:
        "Published artworks in the grid, in editorial order. Unpublished artworks are omitted.",
      resolve: async ({ artworks }, args, { artworksLoader }) => {
        // Gravity's batched lookup only matches internal ids, not slugs
        const ids: string[] = (artworks ?? [])
          .map((artwork) => artwork.id)
          .filter(Boolean)

        if (ids.length === 0) return emptyConnection

        const { page, size } = convertConnectionArgsToGravityArgs(args)

        const body = await artworksLoader({ ids, batched: true })
        const totalCount = body.length

        return {
          totalCount,
          pageCursors: createPageCursors({ page, size }, totalCount),
          ...connectionFromArray(body, args),
        }
      },
    },
  }),
})
