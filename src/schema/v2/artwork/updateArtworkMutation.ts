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

interface UpdateArtworkMutationInputProps {
  id: string
  availability?: boolean
}

const SuccessType = new GraphQLObjectType<any, ResolverContext>({
  name: "updateArtworkSuccess",
  isTypeOf: (data) => data.id,
  fields: () => ({
    artwork: {
      type: Artwork.type,
      resolve: (artwork) => artwork,
    },
  }),
})

const FailureType = new GraphQLObjectType<any, ResolverContext>({
  name: "updateArtworkFailure",
  isTypeOf: (data) => data._type === "GravityMutationError",
  fields: () => ({
    mutationError: {
      type: GravityMutationErrorType,
      resolve: (err) => err,
    },
  }),
})

const ResponseOrErrorType = new GraphQLUnionType({
  name: "updateArtworkResponseOrError",
  types: [SuccessType, FailureType],
})

export const updateArtworkMutation = mutationWithClientMutationId<
  UpdateArtworkMutationInputProps,
  any,
  ResolverContext
>({
  name: "UpdateArtworkMutation",
  description: "Updates an artwork.",
  inputFields: {
    availability: {
      type: GraphQLString,
      description: "The availability of the artwork",
    },
    id: {
      type: new GraphQLNonNull(GraphQLString),
      description: "The id of the artwork to update.",
    },
  },
  outputFields: {
    artworkOrError: {
      type: ResponseOrErrorType,
      description: "On success: the artwork updated.",
      resolve: (result) => result,
    },
  },
  mutateAndGetPayload: async (
    { availability, id },
    { updateArtworkLoader }
  ) => {
    if (!updateArtworkLoader) {
      return new Error("You need to be signed in to perform this action")
    }

    try {
      const response = await updateArtworkLoader(id, {
        availability,
      })
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
