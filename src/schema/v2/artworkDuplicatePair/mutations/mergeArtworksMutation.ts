import {
  GraphQLString,
  GraphQLObjectType,
  GraphQLUnionType,
  GraphQLNonNull,
  GraphQLList,
} from "graphql"
import { mutationWithClientMutationId } from "graphql-relay"
import { ResolverContext } from "types/graphql"
import {
  formatGravityError,
  GravityMutationErrorType,
} from "lib/gravityErrorHandler"
import { ArtworkType } from "../../artwork"
import GraphQLJSON from "graphql-type-json"

const SuccessType = new GraphQLObjectType<any, ResolverContext>({
  name: "MergeArtworksSuccess",
  isTypeOf: (data) => !!data.artwork,
  fields: () => ({
    artwork: {
      type: ArtworkType,
      description: "The merged artwork",
    },
    message: {
      type: GraphQLString,
      description: "Success message",
    },
  }),
})

const FailureType = new GraphQLObjectType<any, ResolverContext>({
  name: "MergeArtworksFailure",
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
  name: "MergeArtworksResponseOrError",
  types: [SuccessType, FailureType],
})

export const MergeArtworksMutation = mutationWithClientMutationId<
  any,
  any,
  ResolverContext
>({
  name: "MergeArtworks",
  description: "Merge two duplicate artworks into one",
  inputFields: {
    duplicatePairID: {
      type: new GraphQLNonNull(GraphQLString),
      description: "Duplicate pair ID",
    },
    primaryArtworkID: {
      type: new GraphQLNonNull(GraphQLString),
      description: "Primary artwork ID to keep",
    },
    secondaryArtworkID: {
      type: new GraphQLNonNull(GraphQLString),
      description: "Secondary artwork ID to merge",
    },
    mergedData: {
      type: new GraphQLNonNull(GraphQLJSON),
      description: "JSON object containing the merged artwork data",
    },
  },
  outputFields: {
    mergeArtworksOrError: {
      type: ResponseOrErrorType,
      resolve: (result) => result,
    },
  },
  mutateAndGetPayload: async (
    { duplicatePairID, primaryArtworkID, secondaryArtworkID, mergedData },
    { mergeDuplicateArtworksLoader }
  ) => {
    if (!mergeDuplicateArtworksLoader) {
      throw new Error("This operation requires an `X-Access-Token` header.")
    }

    try {
      const result = await mergeDuplicateArtworksLoader({
        id: duplicatePairID,
        primaryArtworkId: primaryArtworkID,
        secondaryArtworkId: secondaryArtworkID,
        mergedData: mergedData,
      })
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
