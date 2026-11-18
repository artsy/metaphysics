import {
  GraphQLList,
  GraphQLNonNull,
  GraphQLObjectType,
  GraphQLString,
  GraphQLUnionType,
} from "graphql"
import { mutationWithClientMutationId } from "graphql-relay"
import { uniq } from "lodash"
import {
  formatGravityError,
  GravityMutationErrorType,
} from "lib/gravityErrorHandler"
import { ResolverContext } from "types/graphql"
import { ResaleSubmissionType } from "./resaleSubmission"

export const MAX_ARTWORK_IDS = 30

interface Input {
  artworkIDs: string[]
}

const SuccessType = new GraphQLObjectType<any, ResolverContext>({
  name: "CreateResaleSubmissionSuccess",
  fields: () => ({
    artworkID: {
      type: new GraphQLNonNull(GraphQLString),
      description: "The artwork this result is for.",
      resolve: ({ submitted_artwork_id }) => submitted_artwork_id,
    },
    resaleSubmission: {
      type: ResaleSubmissionType,
      resolve: (result) => result,
    },
  }),
})

const FailureType = new GraphQLObjectType<any, ResolverContext>({
  name: "CreateResaleSubmissionFailure",
  isTypeOf: (data) => data._type === "GravityMutationError",
  fields: () => ({
    artworkID: {
      type: new GraphQLNonNull(GraphQLString),
      description: "The artwork this result is for.",
    },
    mutationError: {
      type: GravityMutationErrorType,
      resolve: (err) => err,
    },
  }),
})

const ResponseOrErrorType = new GraphQLUnionType({
  name: "CreateResaleSubmissionResponseOrError",
  types: [SuccessType, FailureType],
  resolveType: (data) => {
    if (data._type === "GravityMutationError") {
      return "CreateResaleSubmissionFailure"
    }
    return "CreateResaleSubmissionSuccess"
  },
})

export const createResaleSubmissionsMutation = mutationWithClientMutationId<
  Input,
  any,
  ResolverContext
>({
  name: "CreateResaleSubmissions",
  description: "Submit My Collection works for resale assessment.",
  inputFields: {
    artworkIDs: {
      type: new GraphQLNonNull(
        new GraphQLList(new GraphQLNonNull(GraphQLString))
      ),
      description: "The internal IDs of the artworks to assess.",
    },
  },
  outputFields: {
    resaleSubmissionsOrErrors: {
      type: new GraphQLNonNull(
        new GraphQLList(new GraphQLNonNull(ResponseOrErrorType))
      ),
      description:
        "One result per distinct artwork, in the order first sent. On success: the new resale submission.",
      resolve: (result) => result.results,
    },
  },
  mutateAndGetPayload: async (
    { artworkIDs },
    { meCreateResaleSubmissionLoader }
  ) => {
    if (!meCreateResaleSubmissionLoader) {
      throw new Error("You need to be signed in to perform this action")
    }

    const distinctArtworkIDs = uniq(artworkIDs)

    if (distinctArtworkIDs.length === 0) {
      throw new Error("artworkIDs can’t be empty")
    }

    if (distinctArtworkIDs.length > MAX_ARTWORK_IDS) {
      throw new Error(
        `Cannot submit more than ${MAX_ARTWORK_IDS} artworks at a time`
      )
    }

    const results = await Promise.all(
      distinctArtworkIDs.map(async (artworkID) => {
        try {
          return await meCreateResaleSubmissionLoader({
            submitted_artwork_id: artworkID,
          })
        } catch (error) {
          const formattedErr = formatGravityError(error)

          return {
            ...(formattedErr ?? { message: error.message }),
            artworkID,
            _type: "GravityMutationError",
          }
        }
      })
    )

    return { results }
  },
})
