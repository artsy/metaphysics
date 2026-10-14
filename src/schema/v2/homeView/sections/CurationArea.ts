import { connectionFromArray } from "graphql-relay"
import { HomeViewSection } from "."
import { HomeViewSectionTypeNames } from "../sectionTypes/names"
import { HomeViewCurationAreaSection } from "../sectionTypes/CurationArea"
import { CuratorsPicksEmerging } from "./CuratorsPicksEmerging"
import { RecommendedArtists } from "./RecommendedArtists"
import { TrendingArtists } from "./TrendingArtists"

/**
 * Chip navigation: every chip carries an `href`, so the client is uniformly
 * href-based (`RouterLink to={chip.href}`). Artist chips point at the lazy
 * section-screen route (built here, needs the target's id + type); collection
 * chips point at `/collection/<slug>`. `entityType`/`entityID` are for analytics.
 *
 * Artist chips have no model-derived subtitle (an Artists rail is a connection,
 * not a single entity), so their copy is hardcoded. Collection chips derive
 * subtitle + image from the marketing-collection model.
 */

// Mirrors Eigen's getHomeViewSectionHref output for the section-detail screen.
const sectionScreenHref = (section: HomeViewSection): string =>
  `home-view/sections/${section.id}?sectionType=${section.type}`

// Marketing-collection chips, in display order after the artist chips.
// TODO: confirm "blue-chip-icons" is the correct prod slug (verified on staging).
const COLLECTION_CHIP_SLUGS = ["most-loved", "blue-chip-icons"]
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
  // Collection cards sit on gray (spec Greys/Mono5). TODO: palette token once available.
  backgroundColor: "#F7F7F7",

  // One rail (Curators' Picks) + entry chips. TODO: the redesigned "Curated"
  // area drops the rail and is chips-only — flip to `rails: []` + the new large
  // chip set once that design's chip list is finalized.
  rails: [{ sectionID: CuratorsPicksEmerging.id }],

  // Entry chips: two artist curation areas + two marketing collections.
  resolver: async (_parent, args, context) => {
    const artistChips = [
      {
        title: "Recommended Artists",
        // TODO: confirm copy — may be placeholder.
        subtitle:
          "Explore a curated selection of the most exciting artists working today.",
        href: sectionScreenHref(RecommendedArtists),
        entityType: "HomeViewSection",
        entityID: RecommendedArtists.id,
      },
      {
        title: "Trending Artists",
        // TODO: confirm copy — may be placeholder.
        subtitle: "See the works boundary pushing artists are creating.",
        href: sectionScreenHref(TrendingArtists),
        entityType: "HomeViewSection",
        entityID: TrendingArtists.id,
      },
    ]

    const { body = [] } = await context.marketingCollectionsLoader({
      slugs: COLLECTION_CHIP_SLUGS,
      size: COLLECTION_CHIP_SLUGS.length,
    })
    const collections: any[] = body

    // Preserve the configured slug order (the loader may not).
    const bySlug = new Map<string, any>(collections.map((c) => [c.slug, c]))
    const collectionChips = COLLECTION_CHIP_SLUGS.map((slug) =>
      bySlug.get(slug)
    )
      .filter(Boolean)
      .map((collection) => ({
        title: collection.title,
        subtitle: collection.description,
        href: `/collection/${collection.slug}`,
        imageURL: collection.thumbnail,
        entityType: "MarketingCollection",
        entityID: collection.id,
      }))

    return connectionFromArray([...artistChips, ...collectionChips], args)
  },
}
