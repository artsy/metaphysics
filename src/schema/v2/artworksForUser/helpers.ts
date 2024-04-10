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
    const { page, size } = gravityArgs

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

  const query = {
    query: gql`
        query newForYouRecommendationsQuery {
          newForYouRecommendations(
            first: ${args.first}
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
  { ids, marketable }: { ids: string[]; marketable?: boolean },
  gravityArgs,
  context: ResolverContext
): Promise<any[]> => {
  if (ids.length === 0) return []

  const { size, offset } = gravityArgs
  const { artworksLoader } = context

  const artworkParams = {
    availability: "for sale",
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
  remainingSize: number,
  includeBackfill: boolean,
  context: ResolverContext,
  onlyAtAuction = false
): Promise<any[]> => {
  if (!includeBackfill || remainingSize < 1) return []

  const {
    setItemsLoader,
    setsLoader,
    unauthenticatedLoaders: { filterArtworksLoader }, // Not personalized
  } = context

  if (onlyAtAuction) {
    const { hits } = await filterArtworksLoader({
      size: remainingSize,
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

  const { body: itemsBody } = await setItemsLoader(backfillSetId)

  return (itemsBody || []).slice(0, remainingSize)
}

export const getDislikedArtworkIds = async (
  context: ResolverContext
): Promise<string[]> => {
  const { collectionArtworksLoader } = context

  if (!collectionArtworksLoader) return []

  const { body: dislikedArtworks } = await collectionArtworksLoader(
    "disliked-artwork",
    {
      private: true,
      sort: "-created_at",
    }
  )

  return (dislikedArtworks || []).map((artwork) => artwork._id)
}
