import { ContextModule, OwnerType } from "@artsy/cohesion"
import { HomeViewSection } from "."
import { HomeViewSectionTypeNames } from "../sectionTypes/names"

export const NavigationPills: HomeViewSection = {
  id: "home-view-section-quick-links",
  contextModule: ContextModule.quickLinks,
  ownerType: OwnerType.quickLinks,
  type: HomeViewSectionTypeNames.HomeViewSectionNavigationPills,
  requiresAuthentication: true,
  resolver: () => {
    return QUICK_LINKS
  },
}

export interface NavigationPill {
  contextScreenOwnerId?: string | null
  title: string
  href: string
  ownerType: OwnerType
}

const QUICK_LINKS: Array<NavigationPill> = [
  { title: "Follows", href: "/favorites", ownerType: OwnerType.follows },
  { title: "Auctions", href: "/auctions", ownerType: OwnerType.auctions },
  { title: "Saves", href: "/favorites/saves", ownerType: OwnerType.saves },
  {
    title: "Art under $1000",
    href: "/collect?price_range=%2A-1000",
    ownerType: OwnerType.collect,
    contextScreenOwnerId: "/collect?price_range=*-1000",
  },
  {
    title: "Price Database",
    href: "/price-database",
    ownerType: OwnerType.priceDatabase,
  },
  { title: "Editorial", href: "/news", ownerType: OwnerType.articles },
]
