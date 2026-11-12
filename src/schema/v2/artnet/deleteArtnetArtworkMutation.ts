import {
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

interface DeleteArtnetArtworkMutationInputProps {
  id: string
}

const SuccessType = new GraphQLObjectType<any, ResolverContext>({
  name: "DeleteArtnetArtworkSuccess",
  isTypeOf: (data) => data._type !== "GravityMutationError",
  fields: () => ({
    artnetArtwork: {
      type: ArtnetArtworkType,
      description:
        "The ArtnetArtwork the Delete was pushed for. `deleteInFlight` is true while the Delete is pending, and false means it was already destroyed.",
      resolve: (artnetArtwork) => artnetArtwork,
    },
  }),
})

const FailureType = new GraphQLObjectType<any, ResolverContext>({
  name: "DeleteArtnetArtworkFailure",
  isTypeOf: (data) => data._type === "GravityMutationError",
  fields: () => ({
    mutationError: {
      type: GravityMutationErrorType,
      resolve: (err) => err,
    },
  }),
})

const ResponseOrErrorType = new GraphQLUnionType({
  name: "DeleteArtnetArtworkResponseOrError",
  types: [SuccessType, FailureType],
})

export const deleteArtnetArtworkMutation = mutationWithClientMutationId<
  DeleteArtnetArtworkMutationInputProps,
  any,
  ResolverContext
>({
  name: "DeleteArtnetArtworkMutation",
  description:
    "Removes an ArtnetArtwork from Artnet by pushing a Delete. Removal is asynchronous: the ArtnetArtwork is returned as is, with `deleteInFlight` set, and is destroyed once Artnet's Delete task settles and its messages confirm the artwork is gone, after which it can no longer be found. If they don't, it stays and `lastDeleteMessages` says why, and the mutation can be repeated. Repeating it while one is pending does nothing, and edits are refused meanwhile. An ArtnetArtwork whose Create made no artwork on Artnet is destroyed immediately. Requires the `X-Artnet-Token` and `X-Artnet-User-Id` headers.",
  inputFields: {
    id: {
      type: new GraphQLNonNull(GraphQLString),
      description: "The ID of the ArtnetArtwork.",
    },
  },
  outputFields: {
    artnetArtworkOrError: {
      type: ResponseOrErrorType,
      description:
        "On success: the ArtnetArtwork the Delete was pushed for. On error: the error that occurred.",
      resolve: (result) => result,
    },
  },
  mutateAndGetPayload: async ({ id }, { deleteArtnetArtworkLoader }) => {
    if (!deleteArtnetArtworkLoader) {
      throw new Error("You need to be signed in to perform this action")
    }

    try {
      return await deleteArtnetArtworkLoader(id)
    } catch (error) {
      const formatted = formatGravityError(error)
      if (formatted) {
        return { ...formatted, _type: "GravityMutationError" }
      }
      throw error
    }
  },
})
