import { ContextModule } from "@artsy/cohesion"
import { HomeViewSection } from "."
import { HomeViewSectionTypeNames } from "../sectionTypes/names"

export const ShowsForYou: HomeViewSection = {
  id: "home-view-section-shows-for-you",
  type: HomeViewSectionTypeNames.HomeViewSectionShows,
  contextModule: ContextModule.showsRail,
  component: {
    title: "Shows for You",
  },
  requiresAuthentication: true,
}
