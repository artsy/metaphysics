import { connectionFromArray } from "graphql-relay"
import { HomeViewSectionTypeNames } from "../sectionTypes/names"
import { HomeViewCurationAreaSection } from "../sectionTypes/CurationArea"
import { CuratorsPicksEmerging } from "./CuratorsPicksEmerging"
import { RecommendedArtists } from "./RecommendedArtists"
import { TrendingArtists } from "./TrendingArtists"

/**
 * Chip target contract (resolved on the client):
 *   1. If `href` is present, deep-link to it.
 *   2. Otherwise, if `entityType === "HomeViewSection"`, fetch the target rail
 *      via `homeView.section(id: entityID)` and present it.
 * A chip may carry both; `href` wins. We keep both while we confirm which
 * curation areas have dedicated landing pages, then trim the unused path.
 *
 * TODO: finalize chip images (imageURL) and the "Collections" target once design
 * and the collections landing route are confirmed.
 */
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
        entityType: "HomeViewSection",
        entityID: RecommendedArtists.id,
      },
      {
        title: "Trending Artists",
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
