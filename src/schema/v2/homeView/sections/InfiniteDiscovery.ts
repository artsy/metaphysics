import { ContextModule, OwnerType } from "@artsy/cohesion"
import { HomeViewSection } from "."
import { withHomeViewTimeout } from "../helpers/withHomeViewTimeout"
import { HomeViewCard } from "../sectionTypes/Card"
import { HomeViewSectionTypeNames } from "../sectionTypes/names"

export const InfiniteDiscovery: HomeViewSection = {
  contextModule: ContextModule.infiniteDiscoveryBanner,
  id: "home-view-section-infinite-discovery",
  requiresAuthentication: false,
  // TODO: update this to match the first release that can support Infinite Discovery
  minimumEigenVersion: { major: 8, minor: 67, patch: 0 },
  ownerType: OwnerType.infiniteDiscovery,
  type: HomeViewSectionTypeNames.HomeViewSectionCard,

  resolver: withHomeViewTimeout(async (parent, _args, _context, _info) => {
    const card: HomeViewCard = {
      title: "Discover Daily",
      subtitle:
        "Effortless discovery, expert curation — find art you love, one swipe at a time.",
      buttonText: "Try It",
      image_url: "https://files.artsy.net/images/discover_daily_cover.webp",
      entityType: "Page",
      entityID: parent.ownerType,
      badgeText: "New",
    }
    return card
  }),
}
