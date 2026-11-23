import { camelCase } from "lodash"
import {
  GraphQLBoolean,
  GraphQLEnumType,
  GraphQLInt,
  GraphQLNonNull,
  GraphQLObjectType,
  GraphQLString,
} from "graphql"
import { ResolverContext } from "types/graphql"
import { InternalIDFields } from "./object_identification"
import { date } from "./fields/date"
import Image, { normalizeImageData } from "./image"

// The viewing room layout (viewing rooms rebuild). Each value is the string
// Gravity stores. All are empty on a room published before the rebuild, which
// keeps its original layout.
export const ViewingRoomHeroStyleEnum = new GraphQLEnumType({
  name: "ViewingRoomHeroStyle",
  values: {
    EDITORIAL: { value: "editorial" },
    FULL_IMAGE: { value: "full_image" },
  },
})

export const ViewingRoomTextAlignmentEnum = new GraphQLEnumType({
  name: "ViewingRoomTextAlignment",
  values: {
    LEFT: { value: "left" },
    CENTER: { value: "center" },
  },
})

// Each element of the page is aligned on its own (viewing rooms rebuild).
// `ViewingRoomTextAlignment` above is the older single value for the text.
export const ViewingRoomElementAlignmentEnum = new GraphQLEnumType({
  name: "ViewingRoomElementAlignment",
  values: {
    LEFT: { value: "left" },
    CENTER: { value: "center" },
    RIGHT: { value: "right" },
  },
})

// The Gravity key of each aligned element, with its GraphQL field.
export const VIEWING_ROOM_ALIGNED_ELEMENTS = [
  "gallery_name",
  "heading",
  "subtitle",
  "description",
  "curatorial_text",
  "artworks",
] as const

export const ViewingRoomElementAlignmentsType = new GraphQLObjectType<
  any,
  ResolverContext
>({
  name: "ViewingRoomElementAlignments",
  description:
    "Where each element of the room is aligned. Null for an element the gallery hasn't aligned.",
  fields: () =>
    Object.fromEntries(
      VIEWING_ROOM_ALIGNED_ELEMENTS.map((element) => [
        camelCase(element),
        {
          type: ViewingRoomElementAlignmentEnum,
          resolve: (alignments: Record<string, string>) =>
            alignments[element] ?? null,
        },
      ])
    ),
})

export const ViewingRoomArtworkLayoutEnum = new GraphQLEnumType({
  name: "ViewingRoomArtworkLayout",
  values: {
    GRID: { value: "grid" },
    MASONRY: { value: "masonry" },
  },
})

// Single source of truth for the 13 keys Gravity's
// VALID_ARTWORK_FIELD_VISIBILITY_KEYS allowlist accepts (snake_case, as
// stored). Both ArtworkFieldVisibilityType below (read) and
// ArtworkFieldVisibilityInputType (write, in
// publishPartnerListPublicationMutation) are generated from this list. Keep
// it in sync with Gravity's PartnerListPublicationsEndpoint.
//
// `edition_info` (Gravity PR #20428) was replaced by 4 per-edition-set toggles
// — edition_price, edition_availability, edition_size, edition_inventory_count
// — since edition_info is no longer a single display string but an array of
// per-edition-set snapshots, each gated independently. See
// PrivateViewingRoomArtworkType's editionInfo field for the read-side shape.
export const ARTWORK_FIELD_VISIBILITY_KEYS = [
  "artist_name",
  "artwork_title",
  "year",
  "medium",
  "dimensions",
  "price",
  "availability",
  "location",
  "certificate_of_authenticity",
  "edition_price",
  "edition_availability",
  "edition_size",
  "edition_inventory_count",
] as const

// Gravity stores each value as either a real boolean or the literal string
// "true"/"false" (an untyped Grape Hash param isn't coerced for nested keys —
// see PartnerListPublicationArtwork#field_visible? on the Gravity side, which
// casts the same way via ActiveModel::Type::Boolean). Plain JS truthiness
// would treat the string "false" as visible, so cast explicitly here too.
const castVisibility = (value: unknown): boolean | null => {
  if (value === undefined || value === null) return null
  if (typeof value === "boolean") return value
  return String(value).toLowerCase() === "true"
}

export const ArtworkFieldVisibilityType = new GraphQLObjectType<
  any,
  ResolverContext
>({
  name: "ArtworkFieldVisibility",
  fields: () =>
    Object.fromEntries(
      ARTWORK_FIELD_VISIBILITY_KEYS.map((key) => [
        camelCase(key),
        {
          type: GraphQLBoolean,
          resolve: (visibility: Record<string, unknown>) =>
            castVisibility(visibility[key]),
        },
      ])
    ),
})

export const PartnerListPublicationType = new GraphQLObjectType<
  any,
  ResolverContext
>({
  name: "PartnerListPublication",
  fields: () => ({
    ...InternalIDFields,
    partnerListID: {
      type: GraphQLString,
      resolve: ({ partner_list_id }) => partner_list_id,
    },
    published: {
      type: GraphQLBoolean,
    },
    publishedAt: date(({ published_at }) => published_at),
    lastPublishedAt: date(({ last_published_at }) => last_published_at),
    description: {
      type: GraphQLString,
    },
    heading: {
      type: GraphQLString,
      description: "Optional heading shown on the published room.",
    },
    subtitle: {
      type: GraphQLString,
      description:
        "Optional subtitle under the heading (viewing rooms rebuild). Null when the gallery didn't add one.",
    },
    curatorialText: {
      type: GraphQLString,
      description:
        "Long plain-text curatorial text introducing the works (viewing rooms rebuild).",
      resolve: ({ curatorial_text }) => curatorial_text,
    },
    showGalleryName: {
      type: GraphQLBoolean,
      description: "Whether the gallery name is shown on the public page.",
      resolve: ({ show_gallery_name }) => show_gallery_name,
    },
    showLogo: {
      type: GraphQLBoolean,
      description:
        "Whether the gallery's brand kit logo is shown on the public page, apart from the gallery name. Null on a room published before the logo had its own setting.",
      resolve: ({ show_logo }) => show_logo,
    },
    heroStyle: {
      type: ViewingRoomHeroStyleEnum,
      description:
        "Hero banner style (viewing rooms rebuild). Null on a room published before the rebuild.",
      resolve: ({ hero_style }) => hero_style,
    },
    textAlignment: {
      type: ViewingRoomTextAlignmentEnum,
      description:
        "Alignment of the heading and text (viewing rooms rebuild). Null on a room published before the rebuild.",
      resolve: ({ text_alignment }) => text_alignment,
    },
    elementAlignments: {
      type: ViewingRoomElementAlignmentsType,
      description:
        "Where each element of the room is aligned (viewing rooms rebuild). Null on a room published before the elements could be aligned one by one, which falls back to textAlignment for its text.",
      resolve: ({ element_alignments }) => element_alignments,
    },
    artworkLayout: {
      type: ViewingRoomArtworkLayoutEnum,
      description:
        "Artworks as a grid or masonry (viewing rooms rebuild). Null on a room published before the rebuild.",
      resolve: ({ artwork_layout }) => artwork_layout,
    },
    artworkColumns: {
      type: GraphQLInt,
      description:
        "Number of artwork columns, 2 to 4 (viewing rooms rebuild). Null on a room published before the rebuild.",
      resolve: ({ artwork_columns }) => artwork_columns,
    },
    artworksCount: {
      type: new GraphQLNonNull(GraphQLInt),
      description:
        "Number of artworks currently snapshotted into this publication.",
      resolve: ({ artworks_count }) => artworks_count,
    },
    slug: {
      type: GraphQLString,
    },
    href: {
      type: GraphQLString,
      description: "Public-facing path for this private viewing room.",
      resolve: ({ slug }) => (slug ? `/private-viewing-room/${slug}` : null),
    },
    artworkFieldVisibility: {
      type: ArtworkFieldVisibilityType,
      description:
        "Per-field visibility toggles for artworks in the room. Any key the gallery hasn't set is null.",
      resolve: ({ artwork_field_visibility }) => artwork_field_visibility,
    },
    applyBrand: {
      type: GraphQLBoolean,
      resolve: ({ apply_brand }) => apply_brand,
    },
    passcodeProtected: {
      type: GraphQLBoolean,
      resolve: ({ passcode_protected }) => passcode_protected,
    },
    passcode: {
      type: GraphQLString,
      description: "Plain-text passcode gating this room, if one is set.",
    },
    coverImage: {
      type: Image.type,
      description:
        "Cover image for the room's hero banner (viewing rooms rebuild), as currently uploaded. Visitors see the one from the last publish, via PrivateViewingRoom.coverImageURL.",
      resolve: ({ cover_image }) => {
        if (!cover_image) return null
        return {
          ...normalizeImageData(cover_image, true),
          gemini_template_key: "artos-viewing-room-cover",
        }
      },
    },
    createdAt: date(),
    updatedAt: date(),
  }),
})
