import { GraphQLInt, GraphQLNonNull, GraphQLObjectType } from "graphql"
import { connectionFromArray } from "graphql-relay"
import { pageable } from "relay-cursor-paging"
import { convertConnectionArgsToGravityArgs } from "lib/helpers"
import { artworkConnection } from "schema/v2/artwork"
import { createPageCursors } from "schema/v2/fields/pagination"
import { ResolverContext } from "types/graphql"

// Gravity's `/artworks?ids[]=` rejects requests with more than 100 ids
const MAX_ARTWORKS = 100

export const ArticleSectionArtworkGrid = new GraphQLObjectType<
  any,
  ResolverContext
>({
  name: "ArticleSectionArtworkGrid",
  isTypeOf: (section) => section.type === "artwork_grid",
  fields: () => ({
    columns: {
      type: new GraphQLNonNull(GraphQLInt),
      description: "Number of columns the grid renders (2, 3, or 4)",
    },
    artworksConnection: {
      type: artworkConnection.connectionType,
      args: pageable({}),
      description:
        "Published artworks in the grid, in editorial order. Unpublished artworks are omitted.",
      resolve: async ({ artworks }, args, { artworksLoader }) => {
        // Gravity matches `ids` against internal ids only (not slugs), returns
        // them in the requested order, and omits unpublished artworks
        const ids: string[] = (artworks ?? [])
          .map((artwork) => artwork.id)
          .filter(Boolean)
          .slice(0, MAX_ARTWORKS)

        const body = ids.length > 0 ? await artworksLoader({ ids }) : []
        const { page, size } = convertConnectionArgsToGravityArgs(args)

        return {
          totalCount: body.length,
          pageCursors: createPageCursors({ page, size }, body.length),
          ...connectionFromArray(body, args),
        }
      },
    },
  }),
})
