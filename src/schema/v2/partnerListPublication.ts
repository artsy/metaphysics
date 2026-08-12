import { camelCase } from "lodash"
import {
  GraphQLBoolean,
  GraphQLInt,
  GraphQLNonNull,
  GraphQLObjectType,
  GraphQLString,
} from "graphql"
import { ResolverContext } from "types/graphql"
import { InternalIDFields } from "./object_identification"
import { date } from "./fields/date"

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
    showGalleryName: {
      type: GraphQLBoolean,
      description: "Whether the gallery name is shown on the public page.",
      resolve: ({ show_gallery_name }) => show_gallery_name,
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
    createdAt: date(),
    updatedAt: date(),
  }),
})
