import { ContextModule, OwnerType } from "@artsy/cohesion"
import { HomeViewSection } from "."
import { HomeViewSectionTypeNames } from "../sectionTypes/names"
import type { NavigationPill } from "../sectionTypes/NavigationPills"
import { ResolverContext } from "types/graphql"
import { getEigenVersionNumber, isAtLeastVersion } from "lib/semanticVersioning"
import { isFeatureFlagEnabled } from "lib/featureFlags"
import { priceBucketBasedOnPricePreference } from "../helpers/priceBucketBasedOnPricePreference"

export const QuickLinks: HomeViewSection = {
  id: "home-view-section-quick-links",
  contextModule: ContextModule.quickLinks,
  ownerType: OwnerType.quickLinks,
  type: HomeViewSectionTypeNames.HomeViewSectionNavigationPills,
  requiresAuthentication: true,
  resolver: async (_parent, _args, context, _info) => {
    let links = getDisplayableQuickLinks(context)
    links = await maybeInsertYourBidsLink(links, context)
    links = await maybeInsertArtworksWithinPriceBudgetLink(links, context)

    return links
  },
}

function getDisplayableQuickLinks(context: ResolverContext) {
  const quickLinks = isFeatureFlagEnabled("onyx_enable-quick-links-v2")
    ? QUICK_LINKS_V2
    : QUICK_LINKS

  return quickLinks.filter((quickLink) => {
    let isDisplayable = true
    const actualEigenVersion = getEigenVersionNumber(
      context.userAgent as string
    )
    if (actualEigenVersion && quickLink.minimumEigenVersion) {
      isDisplayable = isAtLeastVersion(
        actualEigenVersion,
        quickLink.minimumEigenVersion
      )
    }
    return isDisplayable
  })
}

export const QUICK_LINKS_V2: Array<NavigationPill> = [
  {
    title: "Discover Daily",
    href: "/infinite-discovery",
    ownerType: OwnerType.infiniteDiscovery,
    icon: "ImageSetIcon",
    minimumEigenVersion: { major: 8, minor: 67, patch: 0 }, // same constraint as InfiniteDiscovery section
  },
  {
    title: "Auctions",
    href: "/auctions",
    ownerType: OwnerType.auctions,
    icon: "GavelIcon",
  },
  /*
   * see below for optional Your Bids link inserted here
   */
  {
    title: "New This Week",
    href: "/collection/new-this-week",
    ownerType: OwnerType.collection,
    icon: undefined,
  },
  {
    title: "Articles",
    href: "/articles",
    ownerType: OwnerType.articles,
    icon: "PublicationIcon",
  },
  {
    title: "Statement Pieces",
    href: "/collection/statement-pieces",
    ownerType: OwnerType.collection,
    icon: undefined,
  },
  {
    title: "Paintings",
    href: "/collection/paintings",
    ownerType: OwnerType.collection,
    icon: "ArtworkIcon",
  },
  {
    title: "Galleries for You",
    href: "galleries-for-you",
    ownerType: OwnerType.galleriesForYou,
    icon: "InstitutionIcon",
  },
  {
    title: "Shows for You",
    href: "/shows-for-you",
    ownerType: OwnerType.shows,
    icon: undefined,
  },
  {
    title: "Featured Fairs",
    href: "/featured-fairs",
    ownerType: OwnerType.featuredFairs,
    icon: "FairIcon",
  },
]

export const QUICK_LINKS: Array<NavigationPill> = [
  {
    title: "Saves",
    href: "/favorites/saves",
    ownerType: OwnerType.saves,
    icon: "HeartStrokeIcon",
  },
  {
    title: "Auctions",
    href: "/auctions",
    ownerType: OwnerType.auctions,
    icon: "GavelIcon",
  },
  {
    title: "New This Week",
    href: "/collection/new-this-week",
    ownerType: OwnerType.collection,
    icon: undefined,
  },
  {
    title: "Editorial",
    href: "/articles",
    ownerType: OwnerType.articles,
    icon: "PublicationIcon",
  },
  {
    title: "Statement Pieces",
    href: "/collection/statement-pieces",
    ownerType: OwnerType.collection,
    icon: undefined,
  },
  {
    title: "Medium",
    href:
      "/collections-by-category/Medium?homeViewSectionId=home-view-section-explore-by-category&entityID=Medium",
    ownerType: OwnerType.collectionsCategory,
    icon: "ArtworkIcon",
  },
  {
    title: "Shows for You",
    href: "/shows-for-you",
    ownerType: OwnerType.shows,
    icon: undefined,
  },
  {
    title: "Featured Fairs",
    href: "/featured-fairs",
    ownerType: OwnerType.featuredFairs,
    icon: "FairIcon",
  },
]

/**
 * If the user has currently active bids then we insert
 * the **Your Bids** link immediately after the **Auctions** link.
 * We return the (maybe) updated full list of quick links.
 */
async function maybeInsertYourBidsLink(
  links: NavigationPill[],
  context: ResolverContext
): Promise<NavigationPill[]> {
  if (isFeatureFlagEnabled("onyx_enable-quick-links-v2")) {
    const { MyBids } = require("schema/v2/me/myBids")
    const bids = await MyBids.resolve?.({}, {}, context, {} as any)
    const hasBids = bids?.active?.length > 0
    const auctionsIndex = links.findIndex((link) => link.href === "/auctions")

    if (hasBids && auctionsIndex >= 0) {
      const yourBids: NavigationPill = {
        title: "Your Bids",
        href: "/inbox",
        ownerType: OwnerType.inbox,
        icon: undefined,
      }
      links.splice(auctionsIndex + 1, 0, yourBids)
    }
  }
  return links
}

/**
 * If the use has a price preference set in Vortex, we insert
 * the **Art Under $X** link immediately after the **New This Week** link.
 * We return the (maybe) updated full list of quick links.
 */
async function maybeInsertArtworksWithinPriceBudgetLink(
  links: NavigationPill[],
  context: ResolverContext
): Promise<NavigationPill[]> {
  if (isFeatureFlagEnabled("onyx_enable-quick-links-price-budget")) {
    const { UserPricePreference } = require("schema/v2/me/userPricePreference")

    const pricePreference = await UserPricePreference.resolve?.(
      {},
      {},
      context,
      {} as any
    )

    if (pricePreference) {
      const priceBucket = priceBucketBasedOnPricePreference(pricePreference)

      if (!priceBucket) {
        return links
      }

      const newThisWeekIndex = links.findIndex(
        (link) => link.href === "/collection/new-this-week"
      )

      const priceBudgetPill: NavigationPill = {
        title: priceBucket.text,
        href: `/collect?price_range=${priceBucket.priceRange}`,
        ownerType: OwnerType.collect,
        icon: undefined,
      }

      links.splice(newThisWeekIndex + 1, 0, priceBudgetPill)
    }
  }

  return links
}
