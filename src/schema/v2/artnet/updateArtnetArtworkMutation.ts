import {
  GraphQLBoolean,
  GraphQLEnumType,
  GraphQLInt,
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
import { ResolverContext } from "types/graphql"
import { ArtnetArtworkType } from "./artnetArtwork"

interface UpdateArtnetArtworkMutationInputProps {
  id: string
  published?: boolean
  availability?: string
  materials?: string
  priceToMinor?: number
  syncOn?: boolean
  syncedFields?: string[]
  syncedEditionSetId?: string
}

const ArtnetSyncedFieldType = new GraphQLEnumType({
  name: "ArtnetSyncedField",
  description:
    "What the inventory row changed, so a sync reclaims only the named fields from it.",
  values: {
    TITLE: { value: "title" },
    DIMENSIONS: { value: "dimensions" },
    DESCRIPTION: { value: "description" },
    MEDIUM: { value: "medium" },
    MATERIALS: { value: "materials" },
    AVAILABILITY: { value: "availability" },
    PRICE: { value: "price" },
  },
})

const SuccessType = new GraphQLObjectType<any, ResolverContext>({
  name: "UpdateArtnetArtworkSuccess",
  isTypeOf: (data) => data._type !== "GravityMutationError",
  fields: () => ({
    artnetArtwork: {
      type: ArtnetArtworkType,
      resolve: (artnetArtwork) => artnetArtwork,
    },
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
    "Updates an ArtnetArtwork and pushes the supported changes to Artnet. At least one of `published`, `availability`, `materials`, `priceToMinor` or `syncOn` is required. Requires the `X-Artnet-Token` and `X-Artnet-User-Id` headers.",
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
    materials: {
      type: GraphQLString,
      description:
        'Free-text materials ("oil on canvas"), distinct from the medium vocabulary. Pass an empty string to clear Artnet\'s; omit to leave it unchanged.',
    },
    priceToMinor: {
      type: GraphQLInt,
      description:
        "Ceiling of Artnet's price range, in minor units. The floor is the catalog artwork's price. Pass null to clear it; omit to leave it unchanged.",
    },
    syncOn: {
      type: GraphQLBoolean,
      description:
        "Also push the artwork-sourced fields (title, dimensions, description, medium, materials, editions), making Gravity the source of truth for them. Set when the edit came from an inventory row rather than the Artnet row.",
    },
    syncedFields: {
      type: new GraphQLList(new GraphQLNonNull(ArtnetSyncedFieldType)),
      description:
        "Read only with syncOn, and ignored without it. Narrows which inventory-row changes are reclaimed, so anything a gallery set directly on the Artnet row survives a sync about something else. Omit to reclaim both price and sale status.",
    },
    syncedEditionSetId: {
      type: GraphQLString,
      description:
        "Read only with syncOn. Narrows syncedFields to one edition set, by its Gravity edition set ID. Omit to apply them to every edition.",
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
  mutateAndGetPayload: async (input, { updateArtnetArtworkLoader }) => {
    const {
      id,
      published,
      availability,
      materials,
      syncOn,
      syncedFields,
      syncedEditionSetId,
    } = input

    if (!updateArtnetArtworkLoader) {
      throw new Error("You need to be signed in to perform this action")
    }

    try {
      return await updateArtnetArtworkLoader(id, {
        published,
        availability,
        materials,
        sync_on: syncOn,
        synced_fields: syncedFields,
        synced_edition_set_id: syncedEditionSetId,
        // Passed only when the client sent the key, so Gravity can tell an omitted ceiling
        // from an explicit null asking to clear one.
        ...(Object.prototype.hasOwnProperty.call(input, "priceToMinor")
          ? { price_to_minor: input.priceToMinor }
          : {}),
      })
    } catch (error) {
      const formatted = formatGravityError(error)
      if (formatted) {
        return { ...formatted, _type: "GravityMutationError" }
      }
      throw error
    }
  },
})
