import {
  GraphQLBoolean,
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
  syncOn?: boolean
}

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
    "Updates an ArtnetArtwork and pushes the supported changes to Artnet. At least one of `published`, `availability` or `syncOn` is required. Requires the `X-Artnet-Token` and `X-Artnet-User-Id` headers.",
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
    syncOn: {
      type: GraphQLBoolean,
      description:
        "Also push the artwork-sourced fields (title, dimensions), making Gravity the source of truth for them. Set when the edit came from an inventory row rather than the Artnet row.",
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
    { id, published, availability, syncOn },
    { updateArtnetArtworkLoader }
  ) => {
    if (!updateArtnetArtworkLoader) {
      throw new Error("You need to be signed in to perform this action")
    }

    try {
      return await updateArtnetArtworkLoader(id, {
        published,
        availability,
        sync_on: syncOn,
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
