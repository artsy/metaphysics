import { ContextModule } from "@artsy/cohesion"
import { HomeViewSection } from "."
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

const auctionsHubCards: HomeViewCard[] = [
  {
    title: "Your Auction Picks",
    href: "/your-auction-picks",
    entityType: "card",
    entityID: "card-your-auction-picks",
  },
  {
    title: "Browse All Auctions",
    href: "/auctions",
    entityType: "card",
    entityID: "card-browse-all-auctions",
  },
  {
    title: "Latest Auction Results",
    href: "/latest-auction-results",
    entityType: "card",
    entityID: "card-latest-auction-results",
  },
]

const yourAuctionPicksCard = async (context): Promise<HomeViewCard | null> => {
  const isAuthenticatedUser = !!context.accessToken

  const args = {
    includeBackfill: true,
    onlyAtAuction: true,
    first: 3,
    excludeDislikedArtworks: true,
    excludeArtworkIds: [],
  }

  if (isAuthenticatedUser) {
    const artworks = await artworksForUser.resolve!(
      context._root,
      args,
      context,
      context.info
    )
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

export const AuctionsHub: HomeViewSection = {
  id: "home-view-section-auctions-hub",
  contextModule: ContextModule.auctionRail,
  type: HomeViewSectionTypeNames.HomeViewSectionCards,
  component: {
    title: "Auctions Hub",
    type: "3UpImageLayout",
  },
  requiresAuthentication: false,
  shouldBeDisplayed: (context) => {
    return shouldDisplayAuctionsHub(context)
  },

  resolver: async (_parent, args, context, _info) => {
    const cards = [await yourAuctionPicksCard(context)]

    return connectionFromArray(cards, args)
  },
}
