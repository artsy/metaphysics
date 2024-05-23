import { mutationWithClientMutationId } from "graphql-relay"
import {
  GraphQLBoolean,
  GraphQLNonNull,
  GraphQLObjectType,
  GraphQLString,
  GraphQLUnionType,
} from "graphql"
import { ResolverContext } from "types/graphql"
import { CareerHighlightType } from "schema/v2/careerHighlight/careerHighlight"
import {
  formatGravityError,
  GravityMutationErrorType,
} from "lib/gravityErrorHandler"
import { snakeCase } from "lodash"

interface Input {
  solo: boolean
  group: boolean
  collected: boolean
  id: string
}

const inputFields = {
  solo: { type: GraphQLBoolean },
  group: { type: GraphQLBoolean },
  collected: { type: GraphQLBoolean },
  id: { type: new GraphQLNonNull(GraphQLString) },
}

interface GravityInput {
  solo: boolean
  group: boolean
  collected: boolean
  id: string
}

const SuccessType = new GraphQLObjectType<any, ResolverContext>({
  name: "UpdateCareerHighlightSuccess",
  isTypeOf: (data) => data.id,
  fields: {
    careerHighlight: {
      type: CareerHighlightType,
      resolve: (careerHighlight) => careerHighlight,
    },
  },
})

const FailureType = new GraphQLObjectType<any, ResolverContext>({
  name: "UpdateCareerHighlightFailure",
  isTypeOf: (data) => data._type === "GravityMutationError",
  fields: () => ({
    mutationError: {
      type: GravityMutationErrorType,
      resolve: (err) => err,
    },
  }),
})

const ResponseOrErrorType = new GraphQLUnionType({
  name: "UpdateCareerHighlightsSuccessResponseOrError",
  types: [SuccessType, FailureType],
})

export const updateCareerHighlightMutation = mutationWithClientMutationId<
  Input,
  any,
  ResolverContext
>({
  name: "UpdateCareerHighlight",
  description: "Updates Artist Career Highlight.",
  inputFields,
  outputFields: {
    careerHighlightOrError: {
      type: ResponseOrErrorType,
      description: "On success: updated Artist Career Highlight.",
      resolve: (result) => result,
    },
  },
  mutateAndGetPayload: async (args, { updateArtistCareerHighlightLoader }) => {
    if (!updateArtistCareerHighlightLoader) {
      throw new Error(
        "You need to pass a X-Access-Token header to perform this action"
      )
    }

    const updateArtistCareerHighlightLoaderPayload = Object.keys(args)
      .filter((key) => key !== "id")
      .reduce(
        (acc, key) => ({ ...acc, [snakeCase(key)]: args[key] }),
        {} as GravityInput
      )

    try {
      return await updateArtistCareerHighlightLoader(
        args.id,
        updateArtistCareerHighlightLoaderPayload
      )
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
