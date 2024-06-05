import { ResolverContext } from "types/graphql"
import { CursorPageable } from "relay-cursor-paging"
import { convertConnectionArgsToGravityArgs, extractNodes } from "lib/helpers"
import gql from "lib/gql"

export const getNewForYouArtworkIDs = async (
  args: CursorPageable,
  context: ResolverContext
): Promise<string[]> => {
  const {
    authenticatedLoaders: {
      vortexGraphqlLoader: vortexGraphQLAuthenticatedLoader,
      auctionLotRecommendationsLoader: auctionLotRecommendationsAuthenticatedLoader,
    },
    unauthenticatedLoaders: {
      vortexGraphqlLoader: vortexGraphQLUnauthenticatedLoader,
      auctionLotRecommendationsLoader: auctionLotRecommendationsUnauthenticatedLoader,
    },
    xImpersonateUserID,
  } = context

  if (args.onlyAtAuction) {
    if (!auctionLotRecommendationsAuthenticatedLoader)
      throw new Error("Authentication failed: User is not authenticated.")

    const userID = args.userId || xImpersonateUserID
    const gravityArgs = convertConnectionArgsToGravityArgs(args)
    const { page } = gravityArgs
    const size = gravityArgs.size + args.excludeArtworkIds.length

    // When a `userID` is specified, this is an app request and we should use the
    // unauthenticated loader. The authenticated loader is for logged-in users.
    const loader = userID
      ? auctionLotRecommendationsUnauthenticatedLoader
      : auctionLotRecommendationsAuthenticatedLoader

    const { data } = await loader({
      page,
      size,
      user_id: userID,
    })

    return data.map((recommendation) => recommendation.artwork_id)
  }
  if (!vortexGraphQLAuthenticatedLoader)
    throw new Error("Authentication failed: User is not authenticated.")

  const userID = args.userId || xImpersonateUserID

  const userIdArgument = userID ? `userId: "${userID}"` : ""
  const versionArgument = args.version ? `version: "${args.version}"` : ""
  const maxWorksPerArtistArgument = args.maxWorksPerArtist
    ? `maxWorksPerArtist: ${args.maxWorksPerArtist}`
    : ""

  const first = args.first + args.excludeArtworkIds.length

  const query = {
    query: gql`
        query newForYouRecommendationsQuery {
          newForYouRecommendations(
            first: ${first}
            ${userIdArgument}
            ${versionArgument}
            ${maxWorksPerArtistArgument}
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
  }

  const vortexResult = xImpersonateUserID
    ? await vortexGraphQLUnauthenticatedLoader(query)()
    : await vortexGraphQLAuthenticatedLoader(query)()

  const artworkIds = extractNodes(
    vortexResult.data?.newForYouRecommendations
  ).map((node: any) => node?.artworkId)

  return artworkIds
}

export const getNewForYouArtworks = async (
  {
    ids,
    marketable,
    excludeDislikedArtworks = false,
  }: { ids: string[]; marketable?: boolean; excludeDislikedArtworks?: boolean },
  gravityArgs,
  context: ResolverContext
): Promise<any[]> => {
  if (ids.length === 0) return []

  const { size, offset } = gravityArgs
  const { artworksLoader } = context

  const artworkParams = {
    availability: "for sale",
    exclude_disliked_artworks: excludeDislikedArtworks,
    ids: ids,
    offset,
    size,
  }

  if (marketable) {
    artworkParams["marketable"] = true
  }

  const body = await artworksLoader(artworkParams)

  return body
}

export const getBackfillArtworks = async (
  size: number,
  includeBackfill: boolean,
  context: ResolverContext,
  onlyAtAuction = false,
  excludeDislikedArtworks = false
): Promise<any[]> => {
  if (!includeBackfill || size < 1) return []

  const {
    setItemsLoader,
    setsLoader,
    authenticatedLoaders: {
      filterArtworksLoader: filterArtworksAuthenticatedLoader,
    },
    unauthenticatedLoaders: {
      filterArtworksLoader: filterArtworksUnauthenticatedLoader,
    },
  } = context

  const filterArtworksLoader =
    excludeDislikedArtworks === true
      ? filterArtworksAuthenticatedLoader
      : filterArtworksUnauthenticatedLoader

  if (filterArtworksLoader && onlyAtAuction) {
    const { hits } = await filterArtworksLoader({
      exclude_disliked_artworks: excludeDislikedArtworks,
      size: size,
      sort: "-decayed_merch",
      marketing_collection_id: "top-auction-lots",
    })

    return hits
  }

  const { body: setsBody } = await setsLoader({
    key: "artwork-backfill",
    sort: "internal_name",
  })
  const backfillSetId = setsBody?.map((set) => set.id)[0]

  if (!backfillSetId) return []

  const { body: itemsBody } = await setItemsLoader(backfillSetId, {
    exclude_disliked_artworks: excludeDislikedArtworks,
  })

  return (itemsBody || []).slice(0, size)
}
