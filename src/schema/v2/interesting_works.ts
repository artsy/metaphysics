import { GraphQLFieldConfig, GraphQLInt } from "graphql"
import { connectionFromArraySlice } from "graphql-relay"
import { convertConnectionArgsToGravityArgs } from "lib/helpers"
import { CursorPageable, pageable } from "relay-cursor-paging"
import { createPageCursors } from "schema/v1/fields/pagination"
import { ResolverContext } from "types/graphql"
import { artworkConnection } from "schema/v2/artwork"
import gql from "lib/gql"

const MAX_ARTISTS = 50
const MAX_ARTWORKS = 100

const InterestingWorksConnection: GraphQLFieldConfig<void, ResolverContext> = {
  description: "A connection of new works by artists the user interacted with.",
  type: artworkConnection.connectionType,
  args: pageable({
    page: { type: GraphQLInt },
  }),
  resolve: async (
    _root,
    args: CursorPageable,
    { vortexGraphqlLoader, artworksLoader }
  ) => {
    if (!vortexGraphqlLoader || !artworksLoader) return

    const result = await vortexGraphqlLoader({
      query: gql`
        query artistAffinitiesQuery {
          artistAffinities(first: ${MAX_ARTISTS}) {
            totalCount
            edges {
              node {
                artistId
                score
              }
            }
          }
        }
      `,
    })()

    const artistIds = result.data.artistAffinities.edges.map(
      (edge) => edge.node.artistId
    )

    const { page, size, offset } = convertConnectionArgsToGravityArgs(args)

    const artworks = await artworksLoader({
      artist_ids: artistIds,
      sort: "-published_at",
      size: MAX_ARTWORKS,
    })

    const count = artworks.length

    return {
      totalCount: count,
      pageCursors: createPageCursors({ ...args, page, size }, count),
      ...connectionFromArraySlice(artworks, args, {
        arrayLength: count,
        sliceStart: offset ?? 0,
      }),
    }
  },
}

export default InterestingWorksConnection
