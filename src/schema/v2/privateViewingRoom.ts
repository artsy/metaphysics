import {
  GraphQLBoolean,
  GraphQLFieldConfig,
  GraphQLList,
  GraphQLNonNull,
  GraphQLObjectType,
  GraphQLString,
} from "graphql"
import { ResolverContext } from "types/graphql"
import { BrandKitType } from "./partner/brandKit"
import { PrivateViewingRoomArtworkType } from "./privateViewingRoomArtwork"

// Shared by PrivateViewingRoomType and PrivateViewingRoomContentsType — every
// field Gravity's room_json actually returns, regardless of whether it's
// reached via the plain GET (passcode_required: false branch) or via a
// successful authenticate. Kept as one field map so the two types can't
// silently drift apart.
const contentFields = () => ({
  galleryName: {
    type: GraphQLString,
    resolve: ({ gallery_name }) => gallery_name,
  },
  description: {
    type: GraphQLString,
  },
  applyBrand: {
    type: GraphQLBoolean,
    resolve: ({ apply_brand }) => apply_brand,
  },
  brandKit: {
    type: BrandKitType,
    resolve: ({ brand_kit }) => brand_kit,
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
// has one clear meaning: whether the room is gated at all. Gravity's GET
// endpoint returns just `{passcode_required: true}` (no content fields) when
// it's gated and unauthenticated, or `{passcode_required: false, ...content}`
// otherwise — so every content field here is nullable.
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

export const PrivateViewingRoom: GraphQLFieldConfig<void, ResolverContext> = {
  type: PrivateViewingRoomType,
  description:
    "Find a private viewing room by slug. Returns null for an unknown/unpublished slug. Returns whether a passcode is required; artwork/gallery data is omitted until authenticated via the authenticatePrivateViewingRoom mutation.",
  args: {
    slug: {
      type: new GraphQLNonNull(GraphQLString),
    },
  },
  resolve: async (_root, { slug }, { privateViewingRoomLoader }) => {
    if (!privateViewingRoomLoader) return null

    try {
      return await privateViewingRoomLoader(slug)
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
