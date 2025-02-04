import { ContextModule, OwnerType } from "@artsy/cohesion"
import { HomeViewSection } from "."
import { HomeViewSectionTypeNames } from "../sectionTypes/names"

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

export interface QuickLink {
  title: string
  href: string
  ownerType: OwnerType
}

const QUICK_LINKS: Array<QuickLink> = [
  { title: "Follows", href: "/favorites", ownerType: OwnerType.follows },
  { title: "Auctions", href: "/auctions", ownerType: OwnerType.auctions },
  { title: "Saves", href: "/favorites/saves", ownerType: OwnerType.saves },
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
  { title: "Editorial", href: "/news", ownerType: OwnerType.articles },
]
