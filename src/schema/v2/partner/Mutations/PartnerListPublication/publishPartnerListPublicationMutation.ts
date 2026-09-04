import { camelCase } from "lodash"
import {
  GraphQLBoolean,
  GraphQLInputObjectType,
  GraphQLNonNull,
  GraphQLObjectType,
  GraphQLString,
  GraphQLUnionType,
} from "graphql"
import { mutationWithClientMutationId } from "graphql-relay"
import {
  formatGravityError,
  GravityMutationErrorType,
} from "lib/gravityErrorHandler"
import { ResolverContext } from "types/graphql"
import {
  ARTWORK_FIELD_VISIBILITY_KEYS,
  PartnerListPublicationType,
} from "schema/v2/partnerListPublication"

// Generated from ARTWORK_FIELD_VISIBILITY_KEYS (schema/v2/partnerListPublication.ts) —
// the write-side counterpart of ArtworkFieldVisibilityType there. Both are
// built from the same list so a key can't drift between read and write.
const ArtworkFieldVisibilityInputType = new GraphQLInputObjectType({
  name: "ArtworkFieldVisibilityInput",
  fields: Object.fromEntries(
    ARTWORK_FIELD_VISIBILITY_KEYS.map((key) => [
      camelCase(key),
      { type: GraphQLBoolean },
    ])
  ),
})

interface PublishPartnerListPublicationMutationInputProps {
  partnerListID: string
  passcode?: string
  description?: string
  heading?: string
  applyBrand?: boolean
  showGalleryName?: boolean
  artworkFieldVisibility?: Record<string, boolean>
}

const SuccessType = new GraphQLObjectType<any, ResolverContext>({
  name: "PublishPartnerListPublicationSuccess",
  isTypeOf: (data) => data.id,
  fields: () => ({
    partnerListPublication: {
      type: PartnerListPublicationType,
      resolve: (publication) => publication,
    },
  }),
})

const FailureType = new GraphQLObjectType<any, ResolverContext>({
  name: "PublishPartnerListPublicationFailure",
  isTypeOf: (data) => data._type === "GravityMutationError",
  fields: () => ({
    mutationError: {
      type: GravityMutationErrorType,
      resolve: (err) => err,
    },
  }),
})

const ResponseOrErrorType = new GraphQLUnionType({
  name: "PublishPartnerListPublicationResponseOrError",
  types: [SuccessType, FailureType],
})

export const publishPartnerListPublicationMutation = mutationWithClientMutationId<
  PublishPartnerListPublicationMutationInputProps,
  any,
  ResolverContext
>({
  name: "PublishPartnerListPublicationMutation",
  description:
    "Publishes (or updates and republishes) a private viewing room for a partner list.",
  inputFields: {
    partnerListID: {
      type: new GraphQLNonNull(GraphQLString),
      description: "The ID of the partner list to publish as a viewing room.",
    },
    passcode: {
      type: GraphQLString,
      description:
        "Passcode to gate the room. Pass an empty string to clear a previously set passcode.",
    },
    description: {
      type: GraphQLString,
      description: "Plain-text description shown on the published room.",
    },
    heading: {
      type: GraphQLString,
      description: "Optional heading shown on the published room.",
    },
    applyBrand: {
      type: GraphQLBoolean,
      description: "Whether to apply the gallery's brand kit to the room.",
    },
    showGalleryName: {
      type: GraphQLBoolean,
      description: "Whether to show the gallery name on the public page.",
    },
    artworkFieldVisibility: {
      type: ArtworkFieldVisibilityInputType,
      description: "Per-field visibility toggles for artworks in the room.",
    },
  },
  outputFields: {
    partnerListPublicationOrError: {
      type: ResponseOrErrorType,
      description:
        "On success: the published partner list publication. On error: the error that occurred.",
      resolve: (result) => result,
    },
  },
  mutateAndGetPayload: async (
    {
      partnerListID,
      passcode,
      description,
      heading,
      applyBrand,
      showGalleryName,
      artworkFieldVisibility,
    },
    { publishPartnerListPublicationLoader }
  ) => {
    if (!publishPartnerListPublicationLoader) {
      return new Error("You need to be signed in to perform this action")
    }

    const gravityArgs: Record<string, unknown> = {}

    // passcode: "" is intentional here, not a bug — it's how a client clears
    // a previously-set passcode. The loader layer's query-string round trip
    // (lib/apis/fetch.ts `constructUrlAndParams`) rewrites an empty string to
    // `null` before it reaches Gravity, and Gravity's own `passcode=` setter
    // treats `nil` (via `new_passcode.presence`) as "clear it" — so an empty
    // string here and an explicit `null` arrive at the same place.
    if (passcode !== undefined) gravityArgs.passcode = passcode
    if (description !== undefined) gravityArgs.description = description
    if (heading !== undefined) gravityArgs.heading = heading
    if (applyBrand !== undefined) gravityArgs.apply_brand = applyBrand
    if (showGalleryName !== undefined)
      gravityArgs.show_gallery_name = showGalleryName
    if (artworkFieldVisibility !== undefined) {
      const visibility: Record<string, boolean> = {}

      // artworkFieldVisibility is keyed camelCase (it came through
      // ArtworkFieldVisibilityInputType, whose fields are generated the same
      // way), so camelCase(key) is how we read back each snake_case Gravity
      // key from it.
      ARTWORK_FIELD_VISIBILITY_KEYS.forEach((key) => {
        const value = artworkFieldVisibility[camelCase(key)]
        if (value !== undefined) visibility[key] = value
      })

      gravityArgs.artwork_field_visibility = visibility
    }

    try {
      return await publishPartnerListPublicationLoader(
        partnerListID,
        gravityArgs
      )
    } catch (error) {
      const formattedErr = formatGravityError(error)
      if (formattedErr) {
        return { ...formattedErr, _type: "GravityMutationError" }
      } else {
        throw new Error(error)
      }
    }
  },
})
