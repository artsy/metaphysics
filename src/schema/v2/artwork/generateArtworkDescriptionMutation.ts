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

interface Input {
  id: string
}

const SuccessType = new GraphQLObjectType<any, ResolverContext>({
  name: "GenerateArtworkDescriptionSuccess",
  isTypeOf: (data) => data.id,
  fields: () => ({
    additionalInformation: {
      type: new GraphQLNonNull(GraphQLString),
      description: "The generated artwork description",
      resolve: ({ additional_information }) => additional_information,
    },
  }),
})

const FailureType = new GraphQLObjectType<any, ResolverContext>({
  name: "GenerateArtworkDescriptionFailure",
  isTypeOf: (data) => data._type === "GravityMutationError",
  fields: () => ({
    mutationError: {
      type: GravityMutationErrorType,
      resolve: (err) => err,
    },
  }),
})

const ResponseOrErrorType = new GraphQLUnionType({
  name: "GenerateArtworkDescriptionResponseOrError",
  types: [SuccessType, FailureType],
  resolveType: (data) => {
    if (data._type === "GravityMutationError") {
      return "GenerateArtworkDescriptionFailure"
    }
    return "GenerateArtworkDescriptionSuccess"
  },
})

export const generateArtworkDescriptionMutation = mutationWithClientMutationId<
  Input,
  any,
  ResolverContext
>({
  name: "GenerateArtworkDescription",
  description:
    "Generate an AI artwork description without saving it to the artwork",
  inputFields: {
    id: {
      type: new GraphQLNonNull(GraphQLString),
      description:
        "The internal ID of the artwork to generate a description for",
    },
  },
  outputFields: {
    artworkDescriptionOrError: {
      type: ResponseOrErrorType,
      description: "On success: the generated artwork description",
      resolve: (result) => result,
    },
  },
  mutateAndGetPayload: async ({ id }, { generateArtworkDescriptionLoader }) => {
    if (!generateArtworkDescriptionLoader) {
      throw new Error("You need to be signed in to perform this action")
    }

    try {
      return await generateArtworkDescriptionLoader(id)
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
