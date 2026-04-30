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

const ReopenArtworkDuplicatePairSuccessType = new GraphQLObjectType<
  any,
  ResolverContext
>({
  name: "ReopenArtworkDuplicatePairSuccess",
  isTypeOf: (data) => data._type !== "GravityMutationError",
  fields: () => ({
    artworkDuplicatePair: {
      type: ArtworkDuplicatePairType,
      resolve: (pair) => pair,
    },
  }),
})

const ReopenArtworkDuplicatePairFailureType = new GraphQLObjectType<
  any,
  ResolverContext
>({
  name: "ReopenArtworkDuplicatePairFailure",
  isTypeOf: (data) => data._type === "GravityMutationError",
  fields: () => ({
    mutationError: {
      type: GravityMutationErrorType,
      resolve: (err) => err,
    },
  }),
})

const ReopenArtworkDuplicatePairResponseOrErrorType = new GraphQLUnionType({
  name: "ReopenArtworkDuplicatePairResponseOrError",
  types: [
    ReopenArtworkDuplicatePairSuccessType,
    ReopenArtworkDuplicatePairFailureType,
  ],
})

export const reopenArtworkDuplicatePairMutation = mutationWithClientMutationId({
  name: "ReopenArtworkDuplicatePairMutation",
  description: "Reopen a dismissed artwork duplicate pair",
  inputFields: {
    id: {
      type: new GraphQLNonNull(GraphQLString),
      description: "The ID of the artwork duplicate pair",
    },
  },
  outputFields: {
    artworkDuplicatePairOrError: {
      type: ReopenArtworkDuplicatePairResponseOrErrorType,
      resolve: (result) => result,
    },
  },
  mutateAndGetPayload: async ({ id }, { updateArtworkDuplicatePairLoader }) => {
    if (!updateArtworkDuplicatePairLoader) {
      throw new Error("You need to be signed in to perform this action")
    }

    try {
      const result = await updateArtworkDuplicatePairLoader(id, {
        status: "open",
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
})
