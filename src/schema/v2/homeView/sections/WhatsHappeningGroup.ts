import { HomeViewSectionTypeNames } from "../sectionTypes/names"
import { HomeViewGroupSection } from "../sectionTypes/Group"
import { FeaturedFairs } from "./FeaturedFairs"
import { ShowsForYou } from "./ShowsForYou"

// Rails-only block; ShowsForYou is auth-gated, so logged-out users see only Featured Fairs.
export const WhatsHappeningGroup: HomeViewGroupSection = {
  id: "home-view-section-whats-happening-group",
  type: HomeViewSectionTypeNames.HomeViewSectionGroup,
  featureFlag: "onyx_home-feed-simplification",
  component: {
    title: "What's Happening",
    description: "See art world events around the world",
    type: "SectionGroup",
  },
  requiresAuthentication: false,
  // TODO: palette token once available.
  backgroundColor: "#F7F7F7",

  rails: [
    { sectionID: FeaturedFairs.id },
    { sectionID: ShowsForYou.id, title: "Shows Near You" },
  ],
}
