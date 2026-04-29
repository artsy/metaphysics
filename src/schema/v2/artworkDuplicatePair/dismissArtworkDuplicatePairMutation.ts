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
import { ArtworkDuplicatePairType } from "./artworkDuplicatePairType"

const DismissArtworkDuplicatePairSuccessType = new GraphQLObjectType<
  any,
  ResolverContext
>({
  name: "DismissArtworkDuplicatePairSuccess",
  isTypeOf: (data) => data._type !== "GravityMutationError",
  fields: () => ({
    artworkDuplicatePair: {
      type: ArtworkDuplicatePairType,
      resolve: (pair) => pair,
    },
  }),
})

const DismissArtworkDuplicatePairFailureType = new GraphQLObjectType<
  any,
  ResolverContext
>({
  name: "DismissArtworkDuplicatePairFailure",
  isTypeOf: (data) => data._type === "GravityMutationError",
  fields: () => ({
    mutationError: {
      type: GravityMutationErrorType,
      resolve: (err) => err,
    },
  }),
})

const DismissArtworkDuplicatePairResponseOrErrorType = new GraphQLUnionType({
  name: "DismissArtworkDuplicatePairResponseOrError",
  types: [
    DismissArtworkDuplicatePairSuccessType,
    DismissArtworkDuplicatePairFailureType,
  ],
})

export const dismissArtworkDuplicatePairMutation = mutationWithClientMutationId(
  {
    name: "DismissArtworkDuplicatePairMutation",
    description: "Dismiss an artwork duplicate pair",
    inputFields: {
      id: {
        type: new GraphQLNonNull(GraphQLString),
        description: "The ID of the artwork duplicate pair",
      },
    },
    outputFields: {
      artworkDuplicatePairOrError: {
        type: DismissArtworkDuplicatePairResponseOrErrorType,
        resolve: (result) => result,
      },
    },
    mutateAndGetPayload: async (
      { id },
      { updateArtworkDuplicatePairLoader }
    ) => {
      if (!updateArtworkDuplicatePairLoader) {
        throw new Error("You need to be signed in to perform this action")
      }

      try {
        const result = await updateArtworkDuplicatePairLoader(id, {
          status: "dismissed",
        })
        return result
      } catch (error) {
        const formattedErr = formatGravityError(error)
        if (formattedErr) {
          return { ...formattedErr, _type: "GravityMutationError" }
        } else {
          throw error instanceof Error ? error : new Error(String(error))
        }
      }
    },
  }
)
