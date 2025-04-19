import {
  GraphQLString,
  GraphQLNonNull,
  GraphQLObjectType,
  GraphQLUnionType,
} from "graphql"
import { mutationWithClientMutationId } from "graphql-relay"
import { ResolverContext } from "types/graphql"
import Artwork from "schema/v2/artwork"
import {
  formatGravityError,
  GravityMutationErrorType,
} from "lib/gravityErrorHandler"

interface DeleteArtworkMutationInputProps {
  id: string
}

const SuccessType = new GraphQLObjectType<any, ResolverContext>({
  name: "DeleteArtworkSuccess",
  isTypeOf: (data) => data.id,
  fields: () => ({
    artwork: {
      type: Artwork.type,
      resolve: (artwork) => artwork,
    },
  }),
})

const FailureType = new GraphQLObjectType<any, ResolverContext>({
  name: "DeleteArtworkFailure",
  isTypeOf: (data) => data._type === "GravityMutationError",
  fields: () => ({
    mutationError: {
      type: GravityMutationErrorType,
      resolve: (err) => err,
    },
  }),
})

const ResponseOrErrorType = new GraphQLUnionType({
  name: "DeleteArtworkResponseOrError",
  types: [SuccessType, FailureType],
})

export const deleteArtworkMutation = mutationWithClientMutationId<
  DeleteArtworkMutationInputProps,
  any,
  ResolverContext
>({
  name: "DeleteArtworkMutation",
  description: "Deletes an artwork.",
  inputFields: {
    id: {
      type: new GraphQLNonNull(GraphQLString),
      description: "The ID of the artwork to delete.",
    },
  },
  outputFields: {
    artworkOrError: {
      type: ResponseOrErrorType,
      description:
        "On success: the deleted artwork. On error: the error that occurred.",
      resolve: (result) => result,
    },
  },
  mutateAndGetPayload: async ({ id }, { deleteArtworkLoader }) => {
    if (!deleteArtworkLoader) {
      return new Error("You need to be signed in to perform this action")
    }

    try {
      const response = await deleteArtworkLoader(id)
      return response
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
