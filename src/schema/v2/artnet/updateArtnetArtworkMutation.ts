import {
  GraphQLBoolean,
  GraphQLList,
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
import { snakeCaseKeys } from "lib/helpers"
import { omitBy, isUndefined } from "lodash"
import { ResolverContext } from "types/graphql"
import { GraphQLLong } from "lib/customTypes/GraphQLLong"
import { ArtnetArtworkType } from "./artnetArtwork"
import { ArtnetPushSkippedField } from "./artnetPushSkip"
import { S3LocationInputType } from "../artwork/updateArtworkMutation"

interface UpdateArtnetArtworkMutationInputProps {
  id: string
  published?: boolean
  availability?: string
  primaryMedium?: string
  additionalMediums?: string[]
  materials?: string
  priceFromMinor?: number
  priceToMinor?: number | null
  syncOn?: boolean
  syncImages?: boolean
  addImageIDs?: string[]
  removeImageIDs?: string[]
  uploadImageS3Locations?: { bucket: string; key: string }[]
  copyImageIDs?: string[]
}

const SuccessType = new GraphQLObjectType<any, ResolverContext>({
  name: "UpdateArtnetArtworkSuccess",
  isTypeOf: (data) => data._type !== "GravityMutationError",
  fields: () => ({
    artnetArtwork: {
      type: ArtnetArtworkType,
      resolve: (artnetArtwork) => artnetArtwork,
    },
    skipped: ArtnetPushSkippedField,
  }),
})

const FailureType = new GraphQLObjectType<any, ResolverContext>({
  name: "UpdateArtnetArtworkFailure",
  isTypeOf: (data) => data._type === "GravityMutationError",
  fields: () => ({
    mutationError: {
      type: GravityMutationErrorType,
      resolve: (err) => err,
    },
  }),
})

const ResponseOrErrorType = new GraphQLUnionType({
  name: "UpdateArtnetArtworkResponseOrError",
  types: [SuccessType, FailureType],
})

export const updateArtnetArtworkMutation = mutationWithClientMutationId<
  UpdateArtnetArtworkMutationInputProps,
  any,
  ResolverContext
>({
  name: "UpdateArtnetArtworkMutation",
  description:
    "Updates an ArtnetArtwork and pushes the supported changes to Artnet. At least one of `published`, `availability`, `primaryMedium`, `additionalMediums`, `materials`, `priceFromMinor`, `priceToMinor`, `syncOn`, `syncImages`, `addImageIDs`, `removeImageIDs`, `uploadImageS3Locations` or `copyImageIDs` is required. Requires the `X-Artnet-Token` and `X-Artnet-User-Id` headers.",
  inputFields: {
    id: {
      type: new GraphQLNonNull(GraphQLString),
      description: "The ID of the ArtnetArtwork.",
    },
    published: {
      type: GraphQLBoolean,
      description: "Publish or unpublish the artwork on Artnet.",
    },
    availability: {
      type: GraphQLString,
      description:
        "Gravity availability (e.g. `for sale`, `sold`), normalized to an Artnet sale status.",
    },
    primaryMedium: {
      type: GraphQLString,
      description:
        "The artwork's primary medium on Artnet, from Artnet's accepted mediums. Replaces the current primary, which is removed from Artnet; the additional mediums are kept. Omit to leave it unchanged.",
    },
    additionalMediums: {
      type: new GraphQLList(new GraphQLNonNull(GraphQLString)),
      description:
        "The artwork's other mediums on Artnet, from Artnet's accepted mediums. Replaces them: what is missing is removed, and an empty list removes them all. Omit to leave them unchanged.",
    },
    materials: {
      type: GraphQLString,
      description:
        'Free-text materials ("oil on canvas"). Omit to leave it unchanged; cannot be cleared, since Gravity clears on an empty string, which is indistinguishable from null by the time a request reaches it from here.',
    },
    priceFromMinor: {
      type: GraphQLLong,
      description:
        "Artnet's own price, in minor units and the artwork's currency, replacing the catalog price there until the next sync. A single price: any ceiling is cleared. Can't be combined with priceToMinor.",
    },
    priceToMinor: {
      type: GraphQLLong,
      description:
        "Ceiling of Artnet's price range, in minor units. With sync off the floor is Artnet's own price when it's in the artwork's currency, otherwise the catalog price, and there must be one. Pass null to clear it; omit to leave it unchanged.",
    },
    syncOn: {
      type: GraphQLBoolean,
      description:
        "Also push the artwork-sourced fields (title, artist, dimensions, description, medium, materials, editions), making Gravity the source of truth for them. The artist is resolved to Artnet's own artist record by best match. Set when the edit came from an inventory row rather than the Artnet row.",
    },
    syncImages: {
      type: GraphQLBoolean,
      description:
        "Add the Artsy artwork's new images to Artnet and remove its deleted ones. Send after an image save. Does nothing when `hasSeparateImageSets` is true, and is ignored when images are named in the same request.",
    },
    addImageIDs: {
      type: new GraphQLList(new GraphQLNonNull(GraphQLString)),
      description:
        "IDs of the Artsy artwork's images to send to Artnet. An image Artnet already holds is ignored; one it did not add before is tried again.",
    },
    removeImageIDs: {
      type: new GraphQLList(new GraphQLNonNull(GraphQLString)),
      description:
        "IDs of `ArtnetArtworkImage`s to remove from Artnet. Artnet keeps at least one image on an artwork. When `hasSeparateImageSets` is false, an image still on the Artsy artwork cannot be removed this way: delete it from the artwork and send `syncImages`.",
    },
    uploadImageS3Locations: {
      type: new GraphQLList(new GraphQLNonNull(S3LocationInputType)),
      description:
        "Image files already uploaded to S3, to add to Artnet without adding them to the Artsy artwork.",
    },
    copyImageIDs: {
      type: new GraphQLList(new GraphQLNonNull(GraphQLString)),
      description:
        "IDs of `ArtnetArtworkImage`s to copy onto the Artsy artwork. Nothing is sent to Artnet. Once the artwork has every image Artnet holds, `hasSeparateImageSets` turns false and `syncImages` applies to it.",
    },
  },
  outputFields: {
    artnetArtworkOrError: {
      type: ResponseOrErrorType,
      description:
        "On success: the updated ArtnetArtwork. On error: the error that occurred.",
      resolve: (result) => result,
    },
  },
  mutateAndGetPayload: async (
    {
      id,
      published,
      availability,
      primaryMedium,
      additionalMediums,
      materials,
      priceFromMinor,
      priceToMinor,
      syncOn,
      syncImages,
      addImageIDs,
      removeImageIDs,
      uploadImageS3Locations,
      copyImageIDs,
    },
    { updateArtnetArtworkLoader }
  ) => {
    if (!updateArtnetArtworkLoader) {
      throw new Error("You need to be signed in to perform this action")
    }

    try {
      const gravityParams = snakeCaseKeys(
        omitBy(
          {
            published,
            availability,
            primaryMedium,
            // qs drops an empty array from the request (ljharb/qs#362), so
            // "remove them all" goes to Gravity as null, which it reads the same.
            additionalMediums:
              additionalMediums?.length === 0 ? null : additionalMediums,
            materials,
            priceFromMinor,
            priceToMinor,
            syncOn,
            syncImages,
            addImageIds: addImageIDs,
            removeImageIds: removeImageIDs,
            uploadLocations: uploadImageS3Locations,
            copyImageIds: copyImageIDs,
          },
          isUndefined
        )
      )

      return await updateArtnetArtworkLoader(id, gravityParams)
    } catch (error) {
      const formatted = formatGravityError(error)
      if (formatted) {
        return { ...formatted, _type: "GravityMutationError" }
      }
      throw error
    }
  },
})
