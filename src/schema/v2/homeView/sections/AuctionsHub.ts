import { ContextModule, OwnerType } from "@artsy/cohesion"
import { HomeViewSection } from "."
import { withHomeViewTimeout } from "../helpers/withHomeViewTimeout"
import { HomeViewSectionTypeNames } from "../sectionTypes/names"
import { connectionFromArray } from "graphql-relay"
import type { HomeViewCard } from "../sectionTypes/Card"
import { isFeatureFlagEnabled } from "lib/featureFlags"
import { getEigenVersionNumber, isAtLeastVersion } from "lib/semanticVersioning"
import { ResolverContext } from "types/graphql"
import { artworksForUser } from "schema/v2/artworksForUser"

interface CardFunctionContext {
  parent?: any
  context: ResolverContext
  info?: any
}

type CardFunction = (ctx: CardFunctionContext) => Promise<HomeViewCard | null>

const extractImageUrls = (
  items: any[],
  pathExtractor: (item: any) => string | undefined
): string[] => {
  return items.map(pathExtractor).filter((url): url is string => Boolean(url))
}

export const shouldDisplayAuctionsHub = (context: ResolverContext): boolean => {
  const actualEigenVersion = getEigenVersionNumber(context.userAgent as string)
  const minimumEigenVersion = { major: 8, minor: 84, patch: 0 }

  if (actualEigenVersion) {
    return (
      isFeatureFlagEnabled("onyx_auctions_hub", {
        userId: context.userID,
      }) && isAtLeastVersion(actualEigenVersion, minimumEigenVersion)
    )
  } else {
    return false
  }
}

const yourAuctionPicksCard: CardFunction = async ({
  parent,
  context,
  info,
}) => {
  const args = {
    includeBackfill: true,
    onlyAtAuction: true,
    first: 3,
    excludeDislikedArtworks: true,
    excludeArtworkIds: [],
  }

  const artworks = await artworksForUser.resolve!(parent, args, context, info)

  const imageURLs = extractImageUrls(
    artworks.edges,
    ({ node }) => node.images?.[0]?.image_urls?.main
  )

  if (imageURLs.length === 0) {
    return null
  }

  const cardDetails: HomeViewCard = {
    title: "Your Auction Picks",
    href: "/auctions/lots-for-you-ending-soon",
    entityType: "card",
    entityID: "card-your-auction-picks",
    imageURLs,
    contextModule: ContextModule.lotsForYouCard,
    ownerType: OwnerType.lotsForYou,
  }

  return cardDetails
}

const browseAllAuctionsCard: CardFunction = async ({ context }) => {
  const gravityOptions = {
    live: true,
    is_auction: true,
    size: 3,
    sort: "-is_artsy_licensed,timely_at,name",
  }

  const sales = await context.salesLoader(gravityOptions)

  const cardDetails: HomeViewCard = {
    title: "No Current or Upcoming Auctions at this time",
    href: "/auctions",
    entityType: "card",
    entityID: "card-browse-all-auctions",
    contextModule: ContextModule.auctionsCard,
    ownerType: OwnerType.auctions,
  }

  if (!sales || sales.length === 0) {
    return cardDetails
  }

  // Process sales with async fallback logic
  const imageURLPromises = sales.map(async (sale: any) => {
    const coverImage = sale.image_urls?.source

    if (coverImage) {
      return coverImage
    }

    // Fallback: get first artwork image from the sale
    try {
      const { body: saleArtworks } = await context.saleArtworksLoader(sale.id, {
        size: 1,
      })
      return saleArtworks[0]?.artwork?.images?.[0]?.image_urls?.larger
    } catch {
      return undefined
    }
  })

  const resolvedImages = await Promise.all(imageURLPromises)
  const imageURLs = resolvedImages.filter((url): url is string => Boolean(url))

  if (imageURLs.length === 0) {
    return null
  }

  return {
    ...cardDetails,
    title: "Current and Upcoming Auctions",
    imageURLs,
  }
}

const latestAuctionResultsCard: CardFunction = async ({
  parent,
  context,
  info,
}) => {
  const finalArgs = {
    state: "past",
    sort: "-sale_date",
    first: 3,
  }

  // Dynamically require to avoid circular dependency
  const AuctionResultsByFollowedArtists = require("schema/v2/me/auctionResultsByFollowedArtists")
    .default

  const cardDetails: HomeViewCard = {
    title: "Follow and engage with artists to see auction results",
    href: "/auction-results-for-artists-you-follow",
    entityType: "card",
    entityID: "card-auction-results-for-artist-you-follow",
    contextModule: ContextModule.auctionResultsForArtistsYouFollowCard,
    ownerType: OwnerType.auctionResultsForArtistsYouFollow,
  }

  const response = await AuctionResultsByFollowedArtists.resolve!(
    parent,
    finalArgs,
    context,
    info
  )

  if (!response || response.edges.length === 0) {
    return cardDetails
  }

  const imageURLs = extractImageUrls(
    response.edges,
    (edge) => edge.node.images?.[0]?.larger
  )

  if (imageURLs.length === 0) {
    return null
  }

  return {
    ...cardDetails,
    title: "Auction Results for Artist You Follow",
    imageURLs,
  }
}

export const AuctionsHub: HomeViewSection = {
  id: "home-view-section-auctions-hub",
  contextModule: "auctionsHubRail" as ContextModule, // ContextModule.auctionsHubRail,
  type: HomeViewSectionTypeNames.HomeViewSectionCards,
  component: {
    title: "Discover Auctions on Artsy",
    type: "3UpImageLayout",
    behaviors: {
      viewAll: {
        href: "/auctions",
        ownerType: OwnerType.auctions,
      },
    },
  },
  requiresAuthentication: true,
  shouldBeDisplayed: (context) => {
    return shouldDisplayAuctionsHub(context)
  },

  resolver: withHomeViewTimeout(async (_parent, args, context, _info) => {
    const cardContext = { parent: _parent, context, info: _info }

    const cards = await Promise.all([
      yourAuctionPicksCard(cardContext),
      browseAllAuctionsCard(cardContext),
      latestAuctionResultsCard(cardContext),
    ])

    const validCards = cards.filter(Boolean)

    return connectionFromArray(validCards, args)
  }),
}
