import { connectionFromArray } from "graphql-relay"
import { HomeViewSection } from "."
import { HomeViewSectionTypeNames } from "../sectionTypes/names"
import { HomeViewCurationAreaSection } from "../sectionTypes/CurationArea"
import { CuratorsPicksEmerging } from "./CuratorsPicksEmerging"
import { RecommendedArtists } from "./RecommendedArtists"
import { TrendingArtists } from "./TrendingArtists"
import { setVersion } from "schema/v2/image/normalize"
import { getDefault } from "schema/v2/image"

/**
 * Chip navigation: every chip carries an `href`, so the client is uniformly
 * href-based (`RouterLink to={chip.href}`). Artist chips point at the lazy
 * section-screen route (built here, needs the target's id + type); collection
 * chips point at `/collection/<slug>`. `entityType`/`entityID` are for analytics.
 *
 * Artist chips have no model-derived subtitle (an Artists rail is a connection,
 * not a single entity), so their copy is hardcoded; their stack image is a
 * stopgap of the rail's first 3 artists' cover images. Collection chips derive
 * subtitle + image from the marketing-collection model.
 */

// Mirrors Eigen's getHomeViewSectionHref output for the section-detail screen.
const sectionScreenHref = (section: HomeViewSection): string =>
  `home-view/sections/${section.id}?sectionType=${section.type}`

// Marketing-collection chips, in display order after the artist chips.
// TODO: confirm "blue-chip-icons" is the correct prod slug (verified on staging).
const COLLECTION_CHIP_SLUGS = ["most-loved", "blue-chip-icons"]

// The card renders a fanned stack of this many images (design's "3-stack").
const CHIP_STACK_SIZE = 3
const STACK_IMAGE_VERSIONS = ["square", "large", "medium"]

const artworkImageURL = (artwork: any): string | undefined => {
  const image = artwork?.images && getDefault(artwork.images)
  return image ? setVersion(image, STACK_IMAGE_VERSIONS) : undefined
}

// Resolve the stack images for the collection chips in ONE batched call. Gravity
// now returns `representative_artwork_ids` (ordered, by merchandisability) on the
// collection payload we already fetched, so we read the ids off it and resolve the
// artworks via `artworksLoader({ ids })` — a single `/artworks` request that
// collapses across all the collection chips (no per-collection fan-out). Returns a
// slug → ordered image URLs map.
const collectionStackImageURLsBySlug = async (
  collections: any[],
  context: any
): Promise<Map<string, string[]>> => {
  const ids = [
    ...new Set(collections.flatMap((c) => c.representative_artwork_ids ?? [])),
  ]
  const artworks: any[] = ids.length
    ? await context.artworksLoader({ ids, batched: true })
    : []

  const urlById = new Map<string, string>()
  artworks.filter(Boolean).forEach((artwork) => {
    const url = artworkImageURL(artwork)
    if (url && artwork._id) urlById.set(artwork._id, url)
  })

  return new Map(
    collections.map((collection) => [
      collection.slug,
      ((collection.representative_artwork_ids ?? []) as string[])
        .map((id) => urlById.get(id))
        .filter((url): url is string => Boolean(url))
        .slice(0, CHIP_STACK_SIZE),
    ])
  )
}

const ARTIST_IMAGE_VERSIONS = ["large", "square", "medium"]

const artistCoverURL = (artist: any): string | undefined =>
  artist?.image_url ? setVersion(artist, ARTIST_IMAGE_VERSIONS) : undefined

// STOPGAP: an artist chip's stack = the referenced rail's first 3 artists' cover
// images, via that rail's own resolver. Section-level (fixed 2 artist chips), not
// an N+1. Degrades to no images on any failure. Superseded by the Gravity field.
export const artistChipStackURLs = async (
  section: HomeViewSection,
  parent: any,
  context: any,
  info: any
): Promise<string[]> => {
  if (!section.resolver) return []
  try {
    const connection: any = await section.resolver(
      parent,
      { first: CHIP_STACK_SIZE },
      context,
      info
    )
    return (connection?.edges ?? [])
      .map((edge: any) => edge.node)
      .map(artistCoverURL)
      .filter(Boolean)
      .slice(0, CHIP_STACK_SIZE)
  } catch {
    return []
  }
}

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
  resolver: async (parent, args, context, info) => {
    const [
      recommendedImages,
      trendingImages,
      { body = [] },
    ] = await Promise.all([
      artistChipStackURLs(RecommendedArtists, parent, context, info),
      artistChipStackURLs(TrendingArtists, parent, context, info),
      context.marketingCollectionsLoader({
        slugs: COLLECTION_CHIP_SLUGS,
        size: COLLECTION_CHIP_SLUGS.length,
      }),
    ])

    const artistChips = [
      {
        title: "Recommended Artists",
        // TODO: confirm copy — may be placeholder.
        subtitle:
          "Explore a curated selection of the most exciting artists working today.",
        href: sectionScreenHref(RecommendedArtists),
        // STOPGAP stack (first 3 artists' covers); omitted if unavailable.
        ...(recommendedImages.length ? { imageURLs: recommendedImages } : {}),
        entityType: "HomeViewSection",
        entityID: RecommendedArtists.id,
      },
      {
        title: "Trending Artists",
        // TODO: confirm copy — may be placeholder.
        subtitle: "See the works boundary pushing artists are creating.",
        href: sectionScreenHref(TrendingArtists),
        ...(trendingImages.length ? { imageURLs: trendingImages } : {}),
        entityType: "HomeViewSection",
        entityID: TrendingArtists.id,
      },
    ]

    // Preserve the configured slug order (the loader may not).
    const bySlug = new Map<string, any>((body as any[]).map((c) => [c.slug, c]))
    const collections = COLLECTION_CHIP_SLUGS.map((slug) =>
      bySlug.get(slug)
    ).filter(Boolean)

    // One batched `/artworks` load for all collection stacks (ids off the payload).
    const stackBySlug = await collectionStackImageURLsBySlug(
      collections,
      context
    )

    const collectionChips = collections.map((collection) => {
      const imageURLs = stackBySlug.get(collection.slug) ?? []
      return {
        title: collection.title,
        subtitle: collection.description,
        href: `/collection/${collection.slug}`,
        // 3-image stack when we have representative artworks; else the single
        // thumbnail. HomeViewCard allows only one of imageURL / imageURLs.
        ...(imageURLs.length
          ? { imageURLs }
          : { imageURL: collection.thumbnail }),
        entityType: "MarketingCollection",
        entityID: collection.id,
      }
    })

    return connectionFromArray([...artistChips, ...collectionChips], args)
  },
}
