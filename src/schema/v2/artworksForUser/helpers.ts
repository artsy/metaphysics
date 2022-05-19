import { ResolverContext } from "types/graphql"
import { CursorPageable } from "relay-cursor-paging"
import { extractNodes } from "lib/helpers"
import gql from "lib/gql"

const MAX_ARTISTS = 50
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
  remainingSize: number,
  includeBackfill: boolean,
  context: ResolverContext
): Promise<any[]> => {
  if (!includeBackfill || remainingSize < 1) return []

  const { setItemsLoader, setsLoader } = context

  const { body: setsBody } = await setsLoader({
    key: "artwork-backfill",
    sort: "internal_name",
  })
  const backfillSetId = setsBody?.map((set) => set.id)[0]

  if (!backfillSetId) return []

  const { body: itemsBody } = await setItemsLoader(backfillSetId)

  return (itemsBody || []).slice(0, remainingSize)
}
