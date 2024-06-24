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
import { CareerHighlightType } from "./careerHighlight"

interface Input {
  id: string
}

const inputFields = {
  id: { type: new GraphQLNonNull(GraphQLString) },
}

const SuccessType = new GraphQLObjectType<any, ResolverContext>({
  name: "DeleteCareerHighlightSuccess",
  isTypeOf: (data) => {
    return data.id
  },
  fields: () => ({
    careerHighlight: {
      type: CareerHighlightType,
      resolve: (careerHighlight) => {
        console.log("careerHighlight")
        console.log(careerHighlight)
        return careerHighlight
      },
    },
  }),
})

const FailureType = new GraphQLObjectType<any, ResolverContext>({
  name: "DeleteCareerHighlightFailure",
  isTypeOf: (data) => data._type === "GravityMutationError",
  fields: () => ({
    mutationError: {
      type: GravityMutationErrorType,
      resolve: (err) => err,
    },
  }),
})

const ResponseOrErrorType = new GraphQLUnionType({
  name: "DeleteCareerHighlightSuccessOrErrorType",
  types: [SuccessType, FailureType],
})

export const deleteCareerHighlightMutation = mutationWithClientMutationId<
  Input,
  any | null,
  ResolverContext
>({
  name: "DeleteCareerHighlight",
  description: "Delete an artist career highlight",
  inputFields,
  outputFields: {
    careerHighlightOrError: {
      type: ResponseOrErrorType,
      description:
        "On success: the deleted Artist Career Highlight is returned",
      resolve: (result) => result,
    },
  },
  mutateAndGetPayload: async (
    { id },
    { deleteArtistCareerHighlightLoader }
  ) => {
    if (!deleteArtistCareerHighlightLoader) {
      throw new Error("You need to be signed in to perform this action")
    }
    try {
      return await deleteArtistCareerHighlightLoader(id)
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
