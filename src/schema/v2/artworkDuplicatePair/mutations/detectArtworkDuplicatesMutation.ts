import {
  GraphQLString,
  GraphQLObjectType,
  GraphQLUnionType,
  GraphQLNonNull,
  GraphQLInt,
  GraphQLList,
} from "graphql"
import { mutationWithClientMutationId } from "graphql-relay"
import { ResolverContext } from "types/graphql"
import {
  formatGravityError,
  GravityMutationErrorType,
} from "lib/gravityErrorHandler"

const SuccessType = new GraphQLObjectType<any, ResolverContext>({
  name: "DetectArtworkDuplicatesSuccess",
  isTypeOf: (data) => data.duplicates_count !== undefined,
  fields: () => ({
    duplicatesCount: {
      type: GraphQLInt,
      description: "Number of duplicate pairs found",
      resolve: ({ duplicates_count }) => duplicates_count,
    },
    message: {
      type: GraphQLString,
      description: "Success message",
    },
  }),
})

const FailureType = new GraphQLObjectType<any, ResolverContext>({
  name: "DetectArtworkDuplicatesFailure",
  isTypeOf: (data) => data._type === "GravityMutationError",
  fields: () => ({
    mutationError: {
      type: GravityMutationErrorType,
      resolve: (err) => err,
    },
    errors: {
      type: new GraphQLList(GraphQLString),
      description: "List of errors that occurred executing the mutation",
    },
  }),
})

const ResponseOrErrorType = new GraphQLUnionType({
  name: "DetectArtworkDuplicatesResponseOrError",
  types: [SuccessType, FailureType],
})

export const DetectArtworkDuplicatesMutation = mutationWithClientMutationId<
  any,
  any,
  ResolverContext
>({
  name: "DetectArtworkDuplicates",
  description: "Detect duplicate artworks for a partner",
  inputFields: {
    partnerID: {
      type: new GraphQLNonNull(GraphQLString),
      description: "Partner ID to detect duplicates for",
    },
  },
  outputFields: {
    detectArtworkDuplicatesOrError: {
      type: ResponseOrErrorType,
      resolve: (result) => result,
    },
  },
  mutateAndGetPayload: async ({ partnerID }, { detectDuplicatesLoader }) => {
    if (!detectDuplicatesLoader) {
      throw new Error("This operation requires an `X-Access-Token` header.")
    }

    try {
      const result = await detectDuplicatesLoader({ partnerId: partnerID })
      return result.body
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
