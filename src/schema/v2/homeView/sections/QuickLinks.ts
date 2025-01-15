// import { ContextModule, OwnerType } from "@artsy/cohesion"
import { HomeViewSection } from "."
import { HomeViewSectionTypeNames } from "../sectionTypes/names"

export const QuickLinks: HomeViewSection = {
  id: "home-view-section-quick-links",
  // TODO: add ContextModule quickLinks
  // contextModule: ContextModule.example,

  // TODO: add OwnerType quickLinks
  // ownerType: OwnerType.example,

  type: HomeViewSectionTypeNames.HomeViewSectionQuickLinks,
  requiresAuthentication: true,
  resolver: () => {
    return QUICK_LINKS
  },
}

export interface QuickLink {
  title: string
  href: string
}

const QUICK_LINKS: Array<QuickLink> = [
  { title: "Follows", href: "/favorites" },
  { title: "Auctions", href: "/auctions" },
  { title: "Saves", href: "/favorites/saves" },
  { title: "Art under $1000", href: "/collect?price_range=%2A-1000" },
  { title: "Price Database", href: "/price-database" },
  { title: "Editorial", href: "/news" },
]
