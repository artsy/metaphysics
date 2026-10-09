import { HomeViewSectionTypeNames } from "../sectionTypes/names"
import { HomeViewCurationAreaSection } from "../sectionTypes/CurationArea"
import { FeaturedFairs } from "./FeaturedFairs"
import { ShowsForYou } from "./ShowsForYou"

/**
 * "What's Happening" curation area: a rails-only block consolidating the
 * Featured Fairs and Shows rails under one header. No chips.
 *
 * "Shows Near You" is a label override of the Shows rail (whose standalone title
 * is "Shows for You"). ShowsForYou requires auth, so for logged-out users that
 * rail is dropped and only Featured Fairs shows — fine while the app is auth-only.
 */
export const WhatsHappeningCurationArea: HomeViewCurationAreaSection = {
  id: "home-view-section-whats-happening-curation-area",
  type: HomeViewSectionTypeNames.HomeViewSectionCurationArea,
  // Gated behind the experiment flag (off in prod, on in staging/review).
  featureFlag: "onyx_home-feed-simplification",
  component: {
    title: "What's Happening",
    description: "See art world events around the world",
    type: "CurationArea",
  },
  requiresAuthentication: false,

  rails: [
    { sectionID: FeaturedFairs.id },
    { sectionID: ShowsForYou.id, title: "Shows Near You" },
  ],
}
