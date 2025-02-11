import { ContextModule, OwnerType } from "@artsy/cohesion"
import { HomeViewSection } from "."
import { HomeViewSectionTypeNames } from "../sectionTypes/names"
import type { NavigationPill } from "../sectionTypes/NavigationPills"

export const QuickLinks: HomeViewSection = {
  id: "home-view-section-quick-links",
  contextModule: ContextModule.quickLinks,
  ownerType: OwnerType.quickLinks,
  type: HomeViewSectionTypeNames.HomeViewSectionNavigationPills,
  requiresAuthentication: true,
  resolver: () => {
    return QUICK_LINKS
  },
}

const QUICK_LINKS: Array<NavigationPill> = [
  {
    title: "Follows",
    href: "/favorites",
    ownerType: OwnerType.follows,
    icon: "FollowArtistIcon",
  },
  {
    title: "Auctions",
    href: "/auctions",
    ownerType: OwnerType.auctions,
    icon: "AuctionIcon",
  },
  {
    title: "Saves",
    href: "/favorites/saves",
    ownerType: OwnerType.saves,
    icon: "HeartIcon",
  },
  {
    title: "Art under $1000",
    href: "/collect?price_range=%2A-1000",
    ownerType: OwnerType.collect,
  },
  {
    title: "Price Database",
    href: "/price-database",
    ownerType: OwnerType.priceDatabase,
  },
  {
    title: "Editorial",
    href: "/news",
    ownerType: OwnerType.articles,
  },
]
