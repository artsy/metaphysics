import { connectionFromArray } from "graphql-relay"
import { HomeViewSection } from "."
import { HomeViewSectionTypeNames } from "../sectionTypes/names"
import { HomeViewGroupSection } from "../sectionTypes/Group"
import { CuratorsPicksEmerging } from "./CuratorsPicksEmerging"
import { RecommendedArtists } from "./RecommendedArtists"
import { TrendingArtists } from "./TrendingArtists"
import { isSectionDisplayable } from "../helpers/isSectionDisplayable"
import { setVersion } from "schema/v2/image/normalize"
import { getDefault } from "schema/v2/image"

// Mirrors Eigen's getHomeViewSectionHref output for the section-detail screen.
const sectionScreenHref = (section: HomeViewSection): string =>
  `home-view/sections/${section.id}?sectionType=${section.type}`

// TODO: confirm "blue-chip-icons" is the correct prod slug (verified on staging).
const COLLECTION_CARD_SLUGS = ["most-loved", "blue-chip-icons"]

const CARD_STACK_SIZE = 3
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
        .slice(0, CARD_STACK_SIZE),
    ])
  )
}

const ARTIST_IMAGE_VERSIONS = ["large", "square", "medium"]

const artistCoverURL = (artist: any): string | undefined =>
  artist?.image_url ? setVersion(artist, ARTIST_IMAGE_VERSIONS) : undefined

// STOPGAP (superseded by the Gravity field): a section-as-card's stack = the first
// 3 of the referenced section's nodes, mapped to image URLs by `toURL`. Section-level,
// not an N+1; degrades to no images on failure.
const sectionStackURLs = async (
  section: HomeViewSection,
  toURL: (node: any) => string | undefined,
  parent: any,
  context: any,
  info: any
): Promise<string[]> => {
  if (!section.resolver) return []
  try {
    const connection: any = await section.resolver(
      parent,
      { first: CARD_STACK_SIZE },
      context,
      info
    )
    return (connection?.edges ?? [])
      .map((edge: any) => edge.node)
      .map(toURL)
      .filter(Boolean)
      .slice(0, CARD_STACK_SIZE)
  } catch {
    return []
  }
}

// Artists rail → first 3 artists' cover images.
export const artistCardStackURLs = (
  section: HomeViewSection,
  parent: any,
  context: any,
  info: any
): Promise<string[]> =>
  sectionStackURLs(section, artistCoverURL, parent, context, info)

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

  // Cards-only (no rail): Curator's Picks is now a card alongside the artists.
  rails: [],

  cardGroups: [
    {
      resolver: async (parent, args, context, info) => {
        const [
          recommendedImages,
          curatorsPicksImages,
          trendingImages,
          { body = [] },
        ] = await Promise.all([
          artistCardStackURLs(RecommendedArtists, parent, context, info),
          // Curator's Picks is an artworks section → stack the first 3 artworks.
          sectionStackURLs(
            CuratorsPicksEmerging,
            artworkImageURL,
            parent,
            context,
            info
          ),
          artistCardStackURLs(TrendingArtists, parent, context, info),
          context.marketingCollectionsLoader({
            slugs: COLLECTION_CARD_SLUGS,
            size: COLLECTION_CARD_SLUGS.length,
          }),
        ])

        const sectionCards = [
          {
            section: RecommendedArtists,
            title: "Recommended Artists",
            subtitle:
              "Explore a curated selection of the most exciting artists working today.",
            images: recommendedImages,
          },
          {
            section: CuratorsPicksEmerging,
            title: "Curators' Picks",
            images: curatorsPicksImages,
          },
          {
            section: TrendingArtists,
            title: "Trending Artists",
            subtitle: "See the works boundary pushing artists are creating.",
            images: trendingImages,
          },
        ]
          .filter(({ section }) => isSectionDisplayable(section, context))
          .map(({ section, title, subtitle, images }) => ({
            title,
            ...(subtitle ? { subtitle } : {}),
            href: sectionScreenHref(section),
            // STOPGAP stack (first 3 covers/artworks); omitted if unavailable.
            ...(images.length ? { imageURLs: images } : {}),
            entityType: "HomeViewSection",
            entityID: section.id,
          }))

        // Preserve the configured slug order (the loader may not).
        const bySlug = new Map<string, any>(
          (body as any[]).map((c) => [c.slug, c])
        )
        const collections = COLLECTION_CARD_SLUGS.map((slug) =>
          bySlug.get(slug)
        ).filter(Boolean)

        const stackBySlug = await collectionStackImageURLsBySlug(
          collections,
          context
        )

        const collectionCards = collections.map((collection) => {
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

        return connectionFromArray([...sectionCards, ...collectionCards], args)
      },
    },
  ],
}
