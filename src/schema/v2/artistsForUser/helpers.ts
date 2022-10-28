import { ResolverContext } from "types/graphql"
import { CursorPageable } from "relay-cursor-paging"
import { extractNodes } from "lib/helpers"
import gql from "lib/gql"

export const artistRecommendations = async (
  args: CursorPageable,
  context: ResolverContext
): Promise<string[]> => {
  const { appToken, vortexGraphqlLoader, vortexGraphqlLoaderFactory } = context

  const graphqlLoader =
    vortexGraphqlLoader || vortexGraphqlLoaderFactory(appToken)

  const userIdArgument = args.userId ? `userId: "${args.userId}"` : ""
  const maxArtistsArgument = args.maxArtists
    ? `maxWorksPerArtist: ${args.maxArtists}`
    : ""

  const vortexResult = await graphqlLoader({
    query: gql`
        query artistRecommendationsQuery {
          artistRecommendations(
            first: ${args.first}
            ${userIdArgument}
            ${maxArtistsArgument}
          ) {
            totalCount
            edges {
              node {
                id
              }
            }
          }
        }
      `,
  })()

  const artistIds = extractNodes(vortexResult.data?.artistRecommendations).map(
    (node: any) => node?.id
  )

  return artistIds
}

export const getArtistRecommendations = async (
  artistIds: string[],
  gravityArgs,
  context: ResolverContext
): Promise<any[]> => {
  if (artistIds.length === 0) return []

  const { size, offset } = gravityArgs
  const { artistsLoader } = context

  const artistParams = {
    batched: true,
    ids: artistIds,
    offset,
    size,
  }

  const body = await artistsLoader(artistParams)

  return body
}

export const getBackfillArtists = async (
  remainingSize: number,
  includeBackfill: boolean,
  context: ResolverContext
): Promise<any[]> => {
  if (!includeBackfill || remainingSize < 1) return []

  const { setItemsLoader, setsLoader } = context

  const { body: setsBody } = await setsLoader({
    key: "artist-backfill",
    sort: "internal_name",
  })
  const backfillSetId = setsBody?.map((set) => set.id)[0]

  if (!backfillSetId) return []

  const { body: itemsBody } = await setItemsLoader(backfillSetId)

  return (itemsBody || []).slice(0, remainingSize)
}
