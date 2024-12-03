import { HomeViewSection } from "."
import { HomeViewSectionTypeNames } from "../sectionTypes/names"

export const InfiniteDiscovery: HomeViewSection = {
  id: "home-view-section-infinite-discovery",
  featureFlag: "diamond_home-view-infinite-discovery",
  type: HomeViewSectionTypeNames.HomeViewSectionCard,
  requiresAuthentication: true,
}
