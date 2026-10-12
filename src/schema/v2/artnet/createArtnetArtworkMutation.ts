import {
  GraphQLBoolean,
  GraphQLInt,
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

interface CreateArtnetArtworkMutationInputProps {
  artworkID: string
  artnetArtistID?: number
  published?: boolean
}

const SuccessType = new GraphQLObjectType<any, ResolverContext>({
  name: "CreateArtnetArtworkSuccess",
  isTypeOf: (data) => data._type !== "GravityMutationError",
  fields: () => ({
    artnetArtwork: {
      type: ArtnetArtworkType,
      resolve: (artnetArtwork) => artnetArtwork,
    },
  }),
})

const FailureType = new GraphQLObjectType<any, ResolverContext>({
  name: "CreateArtnetArtworkFailure",
  isTypeOf: (data) => data._type === "GravityMutationError",
  fields: () => ({
    mutationError: {
      type: GravityMutationErrorType,
      resolve: (err) => err,
    },
  }),
})

const ResponseOrErrorType = new GraphQLUnionType({
  name: "CreateArtnetArtworkResponseOrError",
  types: [SuccessType, FailureType],
})

export const createArtnetArtworkMutation = mutationWithClientMutationId<
  CreateArtnetArtworkMutationInputProps,
  any,
  ResolverContext
>({
  name: "CreateArtnetArtworkMutation",
  description:
    "Creates an ArtnetArtwork from an existing artwork and its catalog artwork, and pushes the create to Artnet. Requires the `X-Artnet-Token` and `X-Artnet-User-Id` headers.",
  inputFields: {
    artworkID: {
      type: new GraphQLNonNull(GraphQLString),
      description: "The ID of the artwork to distribute to Artnet.",
    },
    artnetArtistID: {
      type: GraphQLInt,
      description:
        "Artnet's own ID for the artist (Gravity has no mapping to it).",
    },
    published: {
      type: GraphQLBoolean,
      description: "Whether Artnet should publish the artwork once created.",
    },
  },
  outputFields: {
    artnetArtworkOrError: {
      type: ResponseOrErrorType,
      description:
        "On success: the created ArtnetArtwork. On error: the error that occurred.",
      resolve: (result) => result,
    },
  },
  mutateAndGetPayload: async (
    { artworkID, artnetArtistID, published },
    { createArtnetArtworkLoader }
  ) => {
    if (!createArtnetArtworkLoader) {
      throw new Error("You need to be signed in to perform this action")
    }

    try {
      return await createArtnetArtworkLoader({
        artwork_id: artworkID,
        artnet_artist_id: artnetArtistID,
        published,
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
