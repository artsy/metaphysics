import { ContextModule, OwnerType } from "@artsy/cohesion"
import { HomeViewSection } from "."
import { HomeViewSectionTypeNames } from "../sectionTypes/names"
import type { NavigationPill } from "../sectionTypes/NavigationPills"
import { ResolverContext } from "types/graphql"
import { getEigenVersionNumber, isAtLeastVersion } from "lib/semanticVersioning"
import { isFeatureFlagEnabled } from "lib/featureFlags"

export const QuickLinks: HomeViewSection = {
  id: "home-view-section-quick-links",
  contextModule: ContextModule.quickLinks,
  ownerType: OwnerType.quickLinks,
  type: HomeViewSectionTypeNames.HomeViewSectionNavigationPills,
  requiresAuthentication: true,
  resolver: (_parent, _args, context, _info) => {
    return getDisplayableQuickLinks(context)
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
