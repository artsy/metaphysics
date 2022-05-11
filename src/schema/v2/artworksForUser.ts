import {
  GraphQLBoolean,
  GraphQLFieldConfig,
  GraphQLInt,
  GraphQLString,
} from "graphql"
import { connectionFromArraySlice } from "graphql-relay"
import { convertConnectionArgsToGravityArgs, extractNodes } from "lib/helpers"
import { CursorPageable, pageable } from "relay-cursor-paging"
import { createPageCursors } from "schema/v1/fields/pagination"
import { ResolverContext } from "types/graphql"
import { artworkConnection } from "schema/v2/artwork"
import gql from "lib/gql"

const MAX_ARTISTS = 50
const MAX_ARTWORKS = 100
const MIN_AFFINITY_SCORE = 0.5

export const getArtistAffinities = async (
  args: CursorPageable,
  context: ResolverContext
): Promise<string[]> => {
  const { appToken, vortexGraphqlLoader, vortexGraphqlLoaderFactory } = context

  const graphqlLoader =
    vortexGraphqlLoader || vortexGraphqlLoaderFactory(appToken)

  const vortexResult = await graphqlLoader({
    query: gql`
        query artistAffinitiesQuery {
          artistAffinities(
            first: ${MAX_ARTISTS}
            minScore: ${MIN_AFFINITY_SCORE}
            userId: "${args.userId}"
          ) {
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

  return artistIds
}

export const getAffinityArtworks = async (
  artistIds: string[],
  gravityArgs,
  context: ResolverContext
): Promise<any[]> => {
  if (artistIds.length === 0) return []

  const { size, offset } = gravityArgs
  const { artworksLoader } = context

  const artworkParams = {
    artist_ids: artistIds,
    availability: "for sale",
    offset,
    size,
    sort: "-published_at",
  }

  const body = await artworksLoader(artworkParams)

  return body
}

export const getBackfillArtworks = async (
  affinityArtworks,
  args: CursorPageable,
  gravityArgs,
  context: ResolverContext
): Promise<any[]> => {
  if (!args.includeBackfill) return []

  // there's some rough edges here where size can end up undefined :(
  const remainingSize = gravityArgs.size - affinityArtworks.length
  console.log("##############################")
  console.log(remainingSize)
  if (remainingSize < 1) return []

  const { artworksLoader, setItemsLoader } = context

  const id = "627bdca867884b000e138abc"
  const response = await setItemsLoader(id)
  const backfillArtworkIds = response.body.map((a) => a.id)
  const artworkParams = {
    ids: backfillArtworkIds,
  }
  const body = await artworksLoader(artworkParams)

  return body.slice(0, remainingSize)
}

export const artworksForUser: GraphQLFieldConfig<void, ResolverContext> = {
  description: "A connection of artworks for a user.",
  type: artworkConnection.connectionType,
  args: pageable({
    // how do i make this not null with a false default?
    includeBackfill: { type: GraphQLBoolean },
    page: { type: GraphQLInt },
    userId: { type: GraphQLString },
  }),
  resolve: async (_root, args: CursorPageable, context) => {
    if (!context.artworksLoader) return

    const artistIds = await getArtistAffinities(args, context)

    const gravityArgs = convertConnectionArgsToGravityArgs(args)
    const { page, size, offset } = gravityArgs

    const affinityArtworks = await getAffinityArtworks(
      artistIds,
      gravityArgs,
      context
    )

    const backfillArtworks = await getBackfillArtworks(
      affinityArtworks,
      args,
      gravityArgs,
      context
    )

    const artworks = [...affinityArtworks, ...backfillArtworks]

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
