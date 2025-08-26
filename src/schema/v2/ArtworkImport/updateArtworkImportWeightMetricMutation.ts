// DEPRECATED: This mutation is deprecated. Use UpdateArtworkImportV2 with weightMetric parameter instead.
import {
  GraphQLString,
  GraphQLObjectType,
  GraphQLUnionType,
  GraphQLNonNull,
} from "graphql"
import { mutationWithClientMutationId } from "graphql-relay"
import { ResolverContext } from "types/graphql"
import {
  formatGravityError,
  GravityMutationErrorType,
} from "lib/gravityErrorHandler"
import { ArtworkImportType } from "./artworkImport"

const SuccessType = new GraphQLObjectType<any, ResolverContext>({
  name: "UpdateArtworkImportWeightMetricSuccess",
  isTypeOf: (data) => !!data.id,
  fields: () => ({
    artworkImport: {
      type: ArtworkImportType,
      resolve: (result) => result,
    },
  }),
})

const FailureType = new GraphQLObjectType<any, ResolverContext>({
  name: "UpdateArtworkImportWeightMetricFailure",
  isTypeOf: (data) => data._type === "GravityMutationError",
  fields: () => ({
    mutationError: {
      type: GravityMutationErrorType,
      resolve: (err) => err,
    },
  }),
})

const ResponseOrErrorType = new GraphQLUnionType({
  name: "UpdateArtworkImportWeightMetricResponseOrError",
  types: [SuccessType, FailureType],
})

export const UpdateArtworkImportWeightMetricMutation = mutationWithClientMutationId<
  any,
  any,
  ResolverContext
>({
  name: "UpdateArtworkImportWeightMetric",
  deprecationReason:
    "This mutation is deprecated. Use UpdateArtworkImportV2 with weightMetric parameter instead.",
  inputFields: {
    artworkImportID: {
      type: new GraphQLNonNull(GraphQLString),
    },
    fromWeightMetric: {
      type: new GraphQLNonNull(GraphQLString),
    },
    toWeightMetric: {
      type: new GraphQLNonNull(GraphQLString),
    },
  },
  outputFields: {
    updateArtworkImportWeightMetricOrError: {
      type: ResponseOrErrorType,
      resolve: (result) => result,
    },
  },
  mutateAndGetPayload: async (
    { artworkImportID, fromWeightMetric, toWeightMetric },
    { artworkImportUpdateWeightMetricLoader }
  ) => {
    if (!artworkImportUpdateWeightMetricLoader) {
      throw new Error("This operation requires an `X-Access-Token` header.")
    }

    try {
      return await artworkImportUpdateWeightMetricLoader(artworkImportID, {
        from_weight_metric: fromWeightMetric,
        to_weight_metric: toWeightMetric,
      })
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
