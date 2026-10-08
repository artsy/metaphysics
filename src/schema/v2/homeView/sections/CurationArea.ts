import { connectionFromArray } from "graphql-relay"
import { HomeViewSection } from "."
import { HomeViewSectionTypeNames } from "../sectionTypes/names"
import { HomeViewCurationAreaSection } from "../sectionTypes/CurationArea"
import { CuratorsPicksEmerging } from "./CuratorsPicksEmerging"
import { RecommendedArtists } from "./RecommendedArtists"
import { TrendingArtists } from "./TrendingArtists"

/**
 * Chip navigation: every chip carries an `href`, so the client is uniformly
 * href-based (`RouterLink to={chip.href}`). For chips that point at another
 * home-view section, the href is the lazy section screen route — built here
 * because it needs the target's section id + type. `entityType`/`entityID` are
 * retained for analytics.
 *
 * TODO: finalize chip images (imageURL) and the "Collections" target once design
 * and the collections landing route are confirmed.
 */

// Mirrors Eigen's getHomeViewSectionHref output for the section-detail screen.
const sectionScreenHref = (section: HomeViewSection): string =>
  `home-view/sections/${section.id}?sectionType=${section.type}`
export const CurationArea: HomeViewCurationAreaSection = {
  id: "home-view-section-curation-area",
  type: HomeViewSectionTypeNames.HomeViewSectionCurationArea,
  // Gate behind the experiment flag so it stays out of the production feed
  // until launch (flag is off in prod, on in staging/review). String literal
  // rather than importing HOME_FEED_SIMPLIFICATION_FLAG to avoid a cycle
  // (recipes -> this section -> rule -> recipes).
  featureFlag: "onyx_home-feed-simplification",
  component: {
    title: "Chosen by our curators",
    // Presentation variant (e.g. 2 large chips vs 3 compact). Client switches
    // on this; the data shape is identical across variants.
    type: "CurationArea",
  },
  requiresAuthentication: false,

  // Lead rail shown inside the container; resolved by reference (stays lazy).
  leadSectionID: CuratorsPicksEmerging.id,

  // Entry chips to the other curation areas this block consolidates.
  resolver: (_parent, args) => {
    const chips = [
      {
        title: "Recommended Artists",
        href: sectionScreenHref(RecommendedArtists),
        entityType: "HomeViewSection",
        entityID: RecommendedArtists.id,
      },
      {
        title: "Trending Artists",
        href: sectionScreenHref(TrendingArtists),
        entityType: "HomeViewSection",
        entityID: TrendingArtists.id,
      },
      {
        title: "Collections",
        // TODO: confirm canonical collections landing route / section target
        href: "/collections",
      },
    ]

    return connectionFromArray(chips, args)
  },
}
