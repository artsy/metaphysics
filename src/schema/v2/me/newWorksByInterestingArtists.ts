import { GraphQLFieldConfig, GraphQLInt } from "graphql"
import { connectionFromArraySlice } from "graphql-relay"
import { convertConnectionArgsToGravityArgs, extractNodes } from "lib/helpers"
import { CursorPageable, pageable } from "relay-cursor-paging"
import { createPageCursors } from "schema/v2/fields/pagination"
import { ResolverContext } from "types/graphql"
import { artworkConnection } from "schema/v2/artwork"
import gql from "lib/gql"

const MAX_ARTISTS = 50
const MAX_ARTWORKS = 100
const MIN_AFFINITY_SCORE = 0.5

export const NewWorksByInterestingArtists: GraphQLFieldConfig<
  void,
  ResolverContext
> = {
  description:
    "A connection of new works by artists the user interacted with (sorted by publication date).",
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

    const { page, size, offset } = convertConnectionArgsToGravityArgs(args)

    // Fetch artist IDs from Vortex

    const vortexResult = await vortexGraphqlLoader({
      query: gql`
        query artistAffinitiesQuery {
          artistAffinities(first: ${MAX_ARTISTS}, minScore: ${MIN_AFFINITY_SCORE}) {
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

    const artistIds = extractNodes(vortexResult.data?.artistAffinities).map(
      (node: any) => node?.artistId
    )

    // Fetch artworks from ArtworksLoader if the user interacted with any artists

    let artworks = []

    if (artistIds?.length) {
      artworks = await artworksLoader({
        artist_ids: artistIds,
        sort: "-published_at",
        availability: "for sale",
        size,
        offset,
      })
    }

    // TODO: get count from artworks loader to optimize pagination
    const count = artworks.length === 0 ? 0 : MAX_ARTWORKS

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
