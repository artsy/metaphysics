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
        "The ArtnetArtwork as it was when the Delete was pushed. Removal is not complete yet, so it can still be read until Artnet confirms it.",
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
    "Removes an ArtnetArtwork from Artnet by pushing a Delete, and from Gravity once Artnet reports it done. Removal is asynchronous: the ArtnetArtwork is returned unchanged and is destroyed when Artnet's task settles, after which it can no longer be found. A Delete Artnet fails leaves the ArtnetArtwork, so the mutation can be repeated; repeating it while one is on its way does nothing. Edits to the ArtnetArtwork are refused while a Delete is pending. An ArtnetArtwork Artnet never created, because it refused the Create, has nothing to delete there and is destroyed immediately. Requires the `X-Artnet-Token` and `X-Artnet-User-Id` headers.",
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
