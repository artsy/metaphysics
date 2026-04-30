import {
  GraphQLInputObjectType,
  GraphQLInt,
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
import { snakeCaseKeys } from "lib/helpers"
import { ResolverContext } from "types/graphql"
import { ArtworkDuplicatePairType } from "./artworkDuplicatePairType"

const ArtworkDuplicateMergeFieldOverridesInput = new GraphQLInputObjectType({
  name: "ArtworkDuplicateMergeFieldOverridesInput",
  fields: {
    title: { type: GraphQLString },
    date: { type: GraphQLString },
    width: { type: GraphQLString },
    height: { type: GraphQLString },
    depth: { type: GraphQLString },
    diameter: { type: GraphQLString },
    metric: { type: GraphQLString },
    medium: { type: GraphQLString },
    availability: { type: GraphQLString },
    priceMinor: { type: GraphQLInt },
    priceCurrency: { type: GraphQLString },
    privateNotes: { type: GraphQLString },
  },
})

const MergeArtworkDuplicatePairSuccessType = new GraphQLObjectType<
  any,
  ResolverContext
>({
  name: "MergeArtworkDuplicatePairSuccess",
  isTypeOf: (data) => data._type !== "GravityMutationError",
  fields: () => ({
    artworkDuplicatePair: {
      type: ArtworkDuplicatePairType,
      resolve: (pair) => pair,
    },
  }),
})

const MergeArtworkDuplicatePairFailureType = new GraphQLObjectType<
  any,
  ResolverContext
>({
  name: "MergeArtworkDuplicatePairFailure",
  isTypeOf: (data) => data._type === "GravityMutationError",
  fields: () => ({
    mutationError: {
      type: GravityMutationErrorType,
      resolve: (err) => err,
    },
  }),
})

const MergeArtworkDuplicatePairResponseOrErrorType = new GraphQLUnionType({
  name: "MergeArtworkDuplicatePairResponseOrError",
  types: [
    MergeArtworkDuplicatePairSuccessType,
    MergeArtworkDuplicatePairFailureType,
  ],
})

export const mergeArtworkDuplicatePairMutation = mutationWithClientMutationId({
  name: "MergeArtworkDuplicatePairMutation",
  description: "Merge an artwork duplicate pair",
  inputFields: {
    id: {
      type: new GraphQLNonNull(GraphQLString),
      description: "The ID of the artwork duplicate pair",
    },
    primaryArtworkId: {
      type: new GraphQLNonNull(GraphQLString),
      description: "The ID of the artwork to keep as primary",
    },
    fieldOverrides: {
      type: ArtworkDuplicateMergeFieldOverridesInput,
      description: "Optional field-level overrides for the merge",
    },
  },
  outputFields: {
    artworkDuplicatePairOrError: {
      type: MergeArtworkDuplicatePairResponseOrErrorType,
      resolve: (result) => result,
    },
  },
  mutateAndGetPayload: async (
    { id, primaryArtworkId, fieldOverrides },
    { updateArtworkDuplicatePairLoader }
  ) => {
    if (!updateArtworkDuplicatePairLoader) {
      throw new Error("You need to be signed in to perform this action")
    }

    try {
      const gravityArgs: Record<string, any> = {
        status: "merged",
        primary_artwork_id: primaryArtworkId,
      }

      if (fieldOverrides) {
        gravityArgs.field_overrides = snakeCaseKeys(fieldOverrides)
      }

      const result = await updateArtworkDuplicatePairLoader(id, gravityArgs)
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
