import {
  GraphQLBoolean,
  GraphQLFieldConfig,
  GraphQLInt,
  GraphQLList,
  GraphQLNonNull,
  GraphQLObjectType,
  GraphQLString,
} from "graphql"
import { ResolverContext } from "types/graphql"
import { BrandKitType } from "./partner/brandKit"
import { PrivateViewingRoomArtworkType } from "./privateViewingRoomArtwork"
import {
  ViewingRoomArtworkLayoutEnum,
  ViewingRoomHeroStyleEnum,
  ViewingRoomElementAlignmentsType,
  ViewingRoomTextAlignmentEnum,
} from "./partnerListPublication"

// Shared by PrivateViewingRoomType and PrivateViewingRoomContentsType — every
// field Gravity's room_json actually returns, regardless of whether it's
// reached via the plain GET or via a successful authenticate. Kept as one field map so the two types can't
// silently drift apart.
const contentFields = () => ({
  galleryName: {
    type: GraphQLString,
    description:
      "The gallery's name, omitted when the gallery has chosen to hide it (show_gallery_name).",
    resolve: ({ gallery_name }) => gallery_name,
  },
  heading: {
    type: GraphQLString,
  },
  subtitle: {
    type: GraphQLString,
    description:
      "Optional subtitle under the heading (viewing rooms rebuild). Omitted when the gallery didn't add one, and for a gated room until authenticated.",
  },
  description: {
    type: GraphQLString,
  },
  curatorialText: {
    type: GraphQLString,
    description:
      "Long plain-text curatorial text introducing the works (viewing rooms rebuild). Omitted when the gallery didn't add any, and for a gated room until authenticated.",
    resolve: ({ curatorial_text }) => curatorial_text,
  },
  applyBrand: {
    type: GraphQLBoolean,
    resolve: ({ apply_brand }) => apply_brand,
  },
  showLogo: {
    type: GraphQLBoolean,
    description:
      "Whether to show the brand kit logo, apart from the gallery name. Null on a room published before the logo had its own setting, which shows the logo in place of the name when the brand is applied. The brand kit also comes with it when only the logo is on; apply its colors and font only when applyBrand is true.",
    resolve: ({ show_logo }) => show_logo,
  },
  brandKit: {
    type: BrandKitType,
    resolve: ({ brand_kit }) => brand_kit,
  },
  coverImageURL: {
    type: GraphQLString,
    description:
      "URL of the room's cover image as of the last publish (viewing rooms rebuild), for the hero banner. Omitted without a cover, and for a gated room until authenticated.",
    resolve: ({ cover_image_url }) => cover_image_url,
  },
  heroStyle: {
    type: ViewingRoomHeroStyleEnum,
    description:
      "Hero banner style (viewing rooms rebuild). Omitted on a room published before the rebuild, which keeps its original layout, and for a gated room until authenticated.",
    resolve: ({ hero_style }) => hero_style,
  },
  textAlignment: {
    type: ViewingRoomTextAlignmentEnum,
    description:
      "Alignment of the heading and text (viewing rooms rebuild). Omitted like heroStyle.",
    resolve: ({ text_alignment }) => text_alignment,
  },
  elementAlignments: {
    type: ViewingRoomElementAlignmentsType,
    description:
      "Where each element of the room is aligned (viewing rooms rebuild). Omitted like heroStyle; a room without it falls back to textAlignment for its text.",
    resolve: ({ element_alignments }) => element_alignments,
  },
  artworkLayout: {
    type: ViewingRoomArtworkLayoutEnum,
    description:
      "Artworks as a grid or masonry (viewing rooms rebuild). Omitted like heroStyle.",
    resolve: ({ artwork_layout }) => artwork_layout,
  },
  artworkColumns: {
    type: GraphQLInt,
    description:
      "Number of artwork columns, 2 to 4 (viewing rooms rebuild). Omitted like heroStyle.",
    resolve: ({ artwork_columns }) => artwork_columns,
  },
  artworks: {
    type: new GraphQLList(new GraphQLNonNull(PrivateViewingRoomArtworkType)),
    resolve: ({ artworks }) => artworks,
  },
})

// Backed by Gravity's public, unauthenticated `private_viewing_room/:slug`
// endpoint (PartnerListPublication + PartnerListPublicationArtwork). Distinct
// from the pre-existing, unrelated `ViewingRoom` type/model in this schema.
//
// Used only by the `privateViewingRoom` query below, where `passcodeRequired`
// has one clear meaning: whether the room is gated at all. When it's gated,
// Gravity's GET endpoint returns only the branding (`gallery_name`,
// `apply_brand`, `brand_kit`) so the passcode page can show the gallery's
// logo; heading, description and artworks come only from a successful
// authenticate. Otherwise it returns `{passcode_required: false, ...content}`
// — so every content field here is nullable.
export const PrivateViewingRoomType = new GraphQLObjectType<
  any,
  ResolverContext
>({
  name: "PrivateViewingRoom",
  fields: () => ({
    passcodeRequired: {
      type: new GraphQLNonNull(GraphQLBoolean),
      description: "Whether this room requires a passcode to view.",
      // Coerced rather than passed straight through: if Gravity's GET ever
      // omitted this key on either branch, a bare `undefined` would violate
      // Boolean! and null the entire privateViewingRoom field — losing
      // gallery name/description/artworks along with it, not just this flag.
      resolve: ({ passcode_required }) => !!passcode_required,
    },
    ...contentFields(),
  }),
})

// Returned by authenticatePrivateViewingRoomMutation on success. Deliberately
// has no `passcodeRequired` field: reaching a Success payload only ever
// happens after Gravity's authenticate endpoint has already confirmed the
// passcode, so the field would always be `false` there and add nothing —
// see the PrivateViewingRoomType doc comment above for the query's version,
// which does carry real signal. Note this content is also never given a
// plain-text passcode field — Gravity's authenticate endpoint doesn't return
// one, matching the public/anonymous path's no-leak guarantee.
export const PrivateViewingRoomContentsType = new GraphQLObjectType<
  any,
  ResolverContext
>({
  name: "PrivateViewingRoomContents",
  fields: contentFields,
})

// A room is addressed by its gallery and slug, or (for rooms shared before the
// gallery was part of the link) by its slug alone. This is what follows
// `private_viewing_room/` in Gravity's public endpoint.
export const getPrivateViewingRoomAddress = ({
  gallerySlug,
  slug,
}: {
  gallerySlug?: string | null
  slug: string
}) => {
  if (!gallerySlug) return encodeURIComponent(slug)

  return `${encodeURIComponent(gallerySlug)}/${encodeURIComponent(slug)}`
}

export const PrivateViewingRoom: GraphQLFieldConfig<void, ResolverContext> = {
  type: PrivateViewingRoomType,
  description:
    "Find a private viewing room by slug. Returns null for an unknown/unpublished slug. Returns whether a passcode is required; for a gated room only the gallery name and brand kit are returned, and heading, description and artworks are omitted until authenticated via the authenticatePrivateViewingRoom mutation.",
  args: {
    gallerySlug: {
      type: GraphQLString,
      description:
        "The gallery's slug, the first part of the room's link. Omit it for a room shared before the gallery was part of the link.",
    },
    slug: {
      type: new GraphQLNonNull(GraphQLString),
    },
  },
  resolve: async (
    _root,
    { gallerySlug, slug },
    { privateViewingRoomLoader }
  ) => {
    if (!privateViewingRoomLoader) return null

    try {
      return await privateViewingRoomLoader(
        getPrivateViewingRoomAddress({ gallerySlug, slug })
      )
    } catch (error) {
      // A public, slug-addressed lookup: an unknown or unpublished room
      // should read as "doesn't exist" to the front end, not as a GraphQL
      // error it has to special-case — same reasoning as
      // PartnerList.publication's 404 handling.
      if (error?.statusCode === 404) return null
      throw error
    }
  },
}
