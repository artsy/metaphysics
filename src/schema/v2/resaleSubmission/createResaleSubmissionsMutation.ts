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
  GravityMutationErrorType,
  formatGravityError,
} from "lib/gravityErrorHandler"
import { ResolverContext } from "types/graphql"
import { ResaleSubmissionType } from "./resaleSubmission"
import { mutationError } from "./mutationError"
import { attachSubmittedArtworks } from "./resaleSubmissionsConnection"

// Metaphysics makes one Gravity call per work, so keep a selection small.
export const MAX_ARTWORKS_PER_REQUEST = 10

const INTERNAL_ID_PATTERN = /^[0-9a-f]{24}$/i

const ResultType = new GraphQLObjectType<any, ResolverContext>({
  name: "CreateResaleSubmissionsResult",
  fields: () => ({
    artworkID: { type: new GraphQLNonNull(GraphQLString) },
    resaleSubmission: {
      type: ResaleSubmissionType,
      description: "Null when this work failed",
    },
    error: {
      type: GravityMutationErrorType,
      description: "Null when this work succeeded",
    },
  }),
})

const SuccessType = new GraphQLObjectType<any, ResolverContext>({
  name: "CreateResaleSubmissionsSuccess",
  isTypeOf: (data) => data._type !== "GravityMutationError",
  fields: () => ({
    results: {
      type: new GraphQLNonNull(new GraphQLList(new GraphQLNonNull(ResultType))),
      description:
        "One result per distinct artwork, in the order they were first sent",
    },
  }),
})

const FailureType = new GraphQLObjectType<any, ResolverContext>({
  name: "CreateResaleSubmissionsFailure",
  isTypeOf: (data) => data._type === "GravityMutationError",
  fields: () => ({
    mutationError: {
      type: GravityMutationErrorType,
      resolve: (err) => err,
    },
  }),
})

const ResponseOrErrorType = new GraphQLUnionType({
  name: "CreateResaleSubmissionsResponseOrError",
  types: [SuccessType, FailureType],
})

interface InputProps {
  artworkIDs: string[]
}

export const createResaleSubmissionsMutation = mutationWithClientMutationId<
  InputProps,
  any,
  ResolverContext
>({
  name: "CreateResaleSubmissions",
  description:
    "Ask Artsy to assess My Collection works for resale. A work that already has an active submission comes back with an error. A rejected assessment is a success; one work failing doesn't fail the others.",
  inputFields: {
    // Eigen's sell flow lets collectors select many works at once, so this takes a list.
    artworkIDs: {
      type: new GraphQLNonNull(
        new GraphQLList(new GraphQLNonNull(GraphQLString))
      ),
      description: `My Collection artwork internalIDs (not slugs), at most ${MAX_ARTWORKS_PER_REQUEST}`,
    },
  },
  outputFields: {
    resaleSubmissionsOrError: {
      type: ResponseOrErrorType,
      resolve: (result) => result,
    },
  },
  mutateAndGetPayload: async (
    { artworkIDs },
    { createResaleSubmissionLoader, meMyCollectionArtworksLoader }
  ) => {
    if (!createResaleSubmissionLoader) {
      throw new Error("You need to be signed in to perform this action")
    }

    const ids = uniq(artworkIDs)

    if (ids.length === 0) {
      return mutationError("artworkIDs can't be empty")
    }
    if (ids.length > MAX_ARTWORKS_PER_REQUEST) {
      return mutationError(
        `artworkIDs can't have more than ${MAX_ARTWORKS_PER_REQUEST} works`
      )
    }
    if (!ids.every((id) => INTERNAL_ID_PATTERN.test(id))) {
      return mutationError("artworkIDs must be artwork internalIDs")
    }

    const results = await Promise.all(
      ids.map(async (artworkID) => {
        try {
          const resaleSubmission = await createResaleSubmissionLoader({
            submitted_artwork_id: artworkID,
          })
          return { artworkID, resaleSubmission, error: null }
        } catch (error) {
          const formatted = formatGravityError(error)
          return {
            artworkID,
            resaleSubmission: null,
            error: formatted
              ? { ...formatted, message: formatted.message || error.message }
              : mutationError(error.message),
          }
        }
      })
    )

    await attachSubmittedArtworks(
      results.flatMap((r) => (r.resaleSubmission ? [r.resaleSubmission] : [])),
      meMyCollectionArtworksLoader
    )

    return { results }
  },
})
