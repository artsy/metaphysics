import { ResolverContext } from "types/graphql"
import { CursorPageable } from "relay-cursor-paging"
import { extractNodes } from "lib/helpers"
import gql from "lib/gql"

export const getNewForYouRecs = async (
  args: CursorPageable,
  context: ResolverContext
): Promise<string[]> => {
  const { appToken, vortexGraphqlLoader, vortexGraphqlLoaderFactory } = context

  const graphqlLoader =
    vortexGraphqlLoader || vortexGraphqlLoaderFactory(appToken)

  const userIdArgument = args.userId ? `userId: "${args.userId}"` : ""
  const versionArgument = args.version ? `version: "${args.version}"` : ""

  const vortexResult = await graphqlLoader({
    query: gql`
        query newForYouRecommendationsQuery {
          newForYouRecommendations(
            first: ${args.first}
            ${userIdArgument}
            ${versionArgument}
          ) {
            totalCount
            edges {
              node {
                artworkId
              }
            }
          }
        }
      `,
  })()

  const artworkIds = extractNodes(
    vortexResult.data?.newForYouRecommendations
  ).map((node: any) => node?.artworkId)

  return artworkIds
}

export const getNewForYouArtworks = async (
  artworkIds: string[],
  gravityArgs,
  context: ResolverContext
): Promise<any[]> => {
  if (artworkIds.length === 0) return []

  const { size, offset } = gravityArgs
  const { artworksLoader } = context

  const artworkParams = {
    availability: "for sale",
    batched: true,
    ids: artworkIds,
    offset,
    size,
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
