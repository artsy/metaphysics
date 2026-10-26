import { connectionFromArray } from "graphql-relay"
import { HomeViewSection } from "."
import { HomeViewSectionTypeNames } from "../sectionTypes/names"
import { HomeViewGroupSection } from "../sectionTypes/Group"
import { CuratorsPicksEmerging } from "./CuratorsPicksEmerging"
import { RecommendedArtists } from "./RecommendedArtists"
import { TrendingArtists } from "./TrendingArtists"
import { setVersion } from "schema/v2/image/normalize"
import { getDefault } from "schema/v2/image"

// Mirrors Eigen's getHomeViewSectionHref output for the section-detail screen.
const sectionScreenHref = (section: HomeViewSection): string =>
  `home-view/sections/${section.id}?sectionType=${section.type}`

// TODO: confirm "blue-chip-icons" is the correct prod slug (verified on staging).
const COLLECTION_CHIP_SLUGS = ["most-loved", "blue-chip-icons"]

const CHIP_STACK_SIZE = 3
const STACK_IMAGE_VERSIONS = ["square", "large", "medium"]

const artworkImageURL = (artwork: any): string | undefined => {
  const image = artwork?.images && getDefault(artwork.images)
  return image ? setVersion(image, STACK_IMAGE_VERSIONS) : undefined
}

// Collection stack images in one batched `/artworks` call (ids come off each
// collection's `representative_artwork_ids`), avoiding a per-collection fan-out.
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

// STOPGAP (superseded by the Gravity field): artist chip stack = the rail's first
// 3 artists' covers. Section-level, not an N+1; degrades to no images on failure.
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

export const CuratedGroup: HomeViewGroupSection = {
  id: "home-view-section-curated-group",
  type: HomeViewSectionTypeNames.HomeViewSectionGroup,
  // String literal (not the imported flag constant) to avoid a recipes -> section -> rule -> recipes cycle.
  featureFlag: "onyx_home-feed-simplification",
  component: {
    title: "Chosen by our curators",
    type: "SectionGroup",
  },
  requiresAuthentication: false,
  // TODO: palette token once available.
  backgroundColor: "#F7F7F7",

  // TODO: redesigned "Curated" is chips-only — flip to `rails: []` once finalized.
  rails: [{ sectionID: CuratorsPicksEmerging.id }],

  chipsGroups: [
    {
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
            ...(recommendedImages.length
              ? { imageURLs: recommendedImages }
              : {}),
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
        const bySlug = new Map<string, any>(
          (body as any[]).map((c) => [c.slug, c])
        )
        const collections = COLLECTION_CHIP_SLUGS.map((slug) =>
          bySlug.get(slug)
        ).filter(Boolean)

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
            // HomeViewCard allows only one of imageURL / imageURLs.
            ...(imageURLs.length
              ? { imageURLs }
              : { imageURL: collection.thumbnail }),
            entityType: "MarketingCollection",
            entityID: collection.id,
          }
        })

        return connectionFromArray([...artistChips, ...collectionChips], args)
      },
    },
  ],
}
