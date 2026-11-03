import { connectionFromArray } from "graphql-relay"
import { HomeViewSection } from "."
import { HomeViewSectionTypeNames } from "../sectionTypes/names"
import { HomeViewGroupSection } from "../sectionTypes/Group"
import { HOME_VIEW_SECTION_GROUP_MINIMUM_EIGEN_VERSION } from "../sectionTypes/groupMinimumEigenVersion"
import { CuratorsPicksEmerging } from "./CuratorsPicksEmerging"
import { RecommendedArtists } from "./RecommendedArtists"
import { TrendingArtists } from "./TrendingArtists"
import { isSectionDisplayable } from "../helpers/isSectionDisplayable"
import { withHomeViewTimeout } from "../helpers/withHomeViewTimeout"
import { setVersion } from "schema/v2/image/normalize"
import { getDefault } from "schema/v2/image"

const sectionScreenHref = (section: HomeViewSection): string =>
  `home-view/sections/${section.id}?sectionType=${section.type}`

const COLLECTION_CARD_SLUGS = ["most-loved", "blue-chip-icons"]

const CARD_STACK_SIZE = 3
const STACK_IMAGE_VERSIONS = ["square", "large", "medium"]

const artworkImageURL = (artwork: any): string | undefined => {
  const image = artwork?.images && getDefault(artwork.images)
  return image ? setVersion(image, STACK_IMAGE_VERSIONS) : undefined
}

const collectionStackImageURLsBySlug = async (
  collections: any[],
  context: any
): Promise<Map<string, string[]>> => {
  // Only the first CARD_STACK_SIZE per collection are shown; slice before merging
  // so the batch stays small, and pass `size` — fetching by id still paginates in
  // Gravity (no size → default page of 10 → extra ids silently dropped).
  const ids = [
    ...new Set(
      collections.flatMap((c) =>
        ((c.representative_artwork_ids ?? []) as string[]).slice(
          0,
          CARD_STACK_SIZE
        )
      )
    ),
  ]
  const artworks: any[] = ids.length
    ? await context
        .artworksLoader({ ids, batched: true, size: ids.length })
        .catch(() => [])
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
  featureFlag: "onyx_home-feed-simplification",
  minimumEigenVersion: HOME_VIEW_SECTION_GROUP_MINIMUM_EIGEN_VERSION,
  component: {
    title: "Chosen by our curators",
    type: "SectionGroup",
  },
  requiresAuthentication: false,
  // TODO: palette token once available.
  backgroundColor: "#F7F7F7",

  rails: [],

  cardGroups: [
    {
      resolver: withHomeViewTimeout(async (parent, args, context, info) => {
        // Filter by displayability BEFORE resolving images, so an auth-gated
        // section (e.g. Recommended Artists for a logged-out viewer) isn't run
        // only to be discarded. `images` is a thunk, invoked only if it passes.
        const displayableSpecs = [
          {
            section: RecommendedArtists,
            title: "Recommended Artists",
            subtitle:
              "Explore a curated selection of the most exciting artists working today.",
            images: () =>
              artistCardStackURLs(RecommendedArtists, parent, context, info),
          },
          {
            section: CuratorsPicksEmerging,
            title: "Curators' Picks",
            // Curator's Picks is an artworks section → stack the first 3 artworks.
            images: () =>
              sectionStackURLs(
                CuratorsPicksEmerging,
                artworkImageURL,
                parent,
                context,
                info
              ),
          },
          {
            section: TrendingArtists,
            title: "Trending Artists",
            subtitle: "See the works boundary pushing artists are creating.",
            images: () =>
              artistCardStackURLs(TrendingArtists, parent, context, info),
          },
        ].filter(({ section }) => isSectionDisplayable(section, context))

        const [sectionImages, { body = [] }] = await Promise.all([
          Promise.all(displayableSpecs.map((spec) => spec.images())),
          context
            .marketingCollectionsLoader({
              slugs: COLLECTION_CARD_SLUGS,
              size: COLLECTION_CARD_SLUGS.length,
            })
            .catch(() => ({ body: [] })),
        ])

        const sectionCards = displayableSpecs.map(
          ({ section, title, subtitle }, index) => ({
            title,
            ...(subtitle ? { subtitle } : {}),
            href: sectionScreenHref(section),
            // STOPGAP stack (first 3 covers/artworks); omitted if unavailable.
            ...(sectionImages[index].length
              ? { imageURLs: sectionImages[index] }
              : {}),
            entityType: "HomeViewSection",
            entityID: section.id,
          })
        )

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
      }),
    },
  ],
}
