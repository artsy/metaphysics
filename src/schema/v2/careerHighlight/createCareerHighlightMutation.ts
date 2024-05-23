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
  artistId: string
  partnerId: string
  solo: boolean
  group: boolean
  collected: boolean
}

const inputFields = {
  artistId: { type: new GraphQLNonNull(GraphQLString) },
  partnerId: { type: new GraphQLNonNull(GraphQLString) },
  solo: { type: GraphQLBoolean },
  group: { type: GraphQLBoolean },
  collected: { type: GraphQLBoolean },
}

interface GravityInput {
  artist_id: string
  partner_id: string
  solo: boolean
  group: boolean
  collected: boolean
}

const SuccessType = new GraphQLObjectType<any, ResolverContext>({
  name: "CreateCareerHighlightSuccess",
  isTypeOf: (data) => data.id,
  fields: {
    careerHighlight: {
      type: CareerHighlightType,
      resolve: (careerHighlight) => careerHighlight,
    },
  },
})

const FailureType = new GraphQLObjectType<any, ResolverContext>({
  name: "CreateCareerHighlightFailure",
  isTypeOf: (data) => data._type === "GravityMutationError",
  fields: () => ({
    mutationError: {
      type: GravityMutationErrorType,
      resolve: (err) => err,
    },
  }),
})

const ResponseOrErrorType = new GraphQLUnionType({
  name: "CreateCareerHighlightSuccessResponseOrError",
  types: [SuccessType, FailureType],
})

export const createCareerHighlightMutation = mutationWithClientMutationId<
  Input,
  any,
  ResolverContext
>({
  name: "CreateCareerHighlight",
  description: "Creates Artist Career Highlight.",
  inputFields,
  outputFields: {
    careerHighlightOrError: {
      type: ResponseOrErrorType,
      description: "On success: the created Artist Career Highlight.",
      resolve: (result) => result,
    },
  },
  mutateAndGetPayload: async (args, { createArtistCareerHighlightLoader }) => {
    if (!createArtistCareerHighlightLoader) {
      throw new Error(
        "You need to pass a X-Access-Token header to perform this action"
      )
    }

    const createArtistCareerHighlightLoaderPayload = Object.keys(args)
      .filter((key) => key !== "id")
      .reduce(
        (acc, key) => ({ ...acc, [snakeCase(key)]: args[key] }),
        {} as GravityInput
      )

    try {
      return await createArtistCareerHighlightLoader(
        createArtistCareerHighlightLoaderPayload
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
