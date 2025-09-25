import { ContextModule } from "@artsy/cohesion"
import { HomeViewSection } from "."
import { withHomeViewTimeout } from "../helpers/withHomeViewTimeout"
import { HomeViewSectionTypeNames } from "../sectionTypes/names"
import { connectionFromArray } from "graphql-relay"
import type { HomeViewCard } from "../sectionTypes/Card"
import { isFeatureFlagEnabled } from "lib/featureFlags"
import { getEigenVersionNumber, isAtLeastVersion } from "lib/semanticVersioning"
import { ResolverContext } from "types/graphql"
import { artworksForUser } from "schema/v2/artworksForUser"

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

const yourAuctionPicksCard = async (
  parent: any,
  context: ResolverContext,
  info: any
): Promise<HomeViewCard | null> => {
  const isAuthenticatedUser = !!context.accessToken

  const args = {
    includeBackfill: true,
    onlyAtAuction: true,
    first: 3,
    excludeDislikedArtworks: true,
    excludeArtworkIds: [],
  }

  if (isAuthenticatedUser) {
    const artworks = await artworksForUser.resolve!(parent, args, context, info)
    const imageURLs = artworks.edges.map(({ node }) => {
      return node.images[0].image_urls["main"]
    })

    return {
      title: "Your Auction Picks",
      href: "/your-auction-picks",
      entityType: "card",
      entityID: "card-your-auction-picks",
      imageURLs,
    }
  } else {
    return null
  }
}

const browseAllAuctionsCard = async (
  context: ResolverContext
): Promise<HomeViewCard | null> => {
  try {
    const gravityOptions = {
      live: true,
      is_auction: true,
      size: 3,
      sort: "-is_artsy_licensed,timely_at,name",
    }
    const sales = await context.salesLoader(gravityOptions)

    // Get artwork images from the first sale that has artworks
    let imageURLs: string[] = []

    for (const sale of sales) {
      try {
        // Get sale artworks (first 3)
        const { body: saleArtworks } = await context.saleArtworksLoader(
          sale.id,
          {
            size: 3,
            page: 1,
          }
        )

        // Extract image URLs from artworks
        const artworkImageURLs = saleArtworks
          .filter(
            (saleArtwork: any) =>
              saleArtwork.artwork?.images?.[0]?.image_urls?.main
          )
          .map(
            (saleArtwork: any) => saleArtwork.artwork.images[0].image_urls.main
          )
          .slice(0, 3)

        if (artworkImageURLs.length > 0) {
          imageURLs = artworkImageURLs
          break // Use images from first sale that has artworks
        }
      } catch (saleError) {
        // Continue to next sale if this one fails
        continue
      }
    }

    return {
      title: "Browse All Auctions",
      href: "/auctions",
      entityType: "card",
      entityID: "card-browse-all-auctions",
      imageURLs: imageURLs.length > 0 ? imageURLs : undefined,
    }
  } catch (error) {
    console.error("Error loading auctions for card:", error)
    return {
      title: "Browse All Auctions",
      href: "/auctions",
      entityType: "card",
      entityID: "card-browse-all-auctions",
    }
  }
}

const latestAuctionResultsCard = async (
  parent: any,
  context: ResolverContext,
  info: any
): Promise<HomeViewCard | null> => {
  try {
    const finalArgs = {
      state: "past",
      sort: "-sale_date",
      first: 3,
    }

    // Dynamically require to avoid circular dependency
    const AuctionResultsByFollowedArtists = require("schema/v2/me/auctionResultsByFollowedArtists")
      .default

    const response = await AuctionResultsByFollowedArtists.resolve!(
      parent,
      finalArgs,
      context,
      info
    )

    const imageURLs = response.edges
      .filter((edge: any) => edge.node.images?.[0]?.thumbnail?.image_url)
      .map((edge: any) => edge.node.images[0].thumbnail.image_url)
      .slice(0, 3)
    return {
      title: "Latest Auction Results",
      href: "/latest-auction-results",
      entityType: "card",
      entityID: "card-latest-auction-results",
      imageURLs,
    }
  } catch (error) {
    console.error("Error loading auction results for card:", error)
    return {
      title: "Latest Auction Results",
      href: "/latest-auction-results",
      entityType: "card",
      entityID: "card-latest-auction-results",
    }
  }
}

export const AuctionsHub: HomeViewSection = {
  id: "home-view-section-auctions-hub",
  contextModule: ContextModule.auctionRail,
  type: HomeViewSectionTypeNames.HomeViewSectionCards,
  component: {
    title: "Auctions Hub",
    type: "3UpImageLayout",
  },
  requiresAuthentication: true,
  shouldBeDisplayed: (context) => {
    return shouldDisplayAuctionsHub(context)
  },

  resolver: withHomeViewTimeout(async (_parent, args, context, _info) => {
    const cards = await Promise.all([
      yourAuctionPicksCard(_parent, context, _info),
      browseAllAuctionsCard(context),
      latestAuctionResultsCard(_parent, context, _info),
    ])

    // Filter out null cards (in case of errors or missing data)
    const validCards = cards.filter(Boolean)

    return connectionFromArray(validCards, args)
  }, 6000),
}
