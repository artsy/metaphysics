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
  name: "UpdateArtworkImportDimensionMetricSuccess",
  isTypeOf: (data) => !!data.id,
  fields: () => ({
    artworkImport: {
      type: ArtworkImportType,
      resolve: (result) => result,
    },
  }),
})

const FailureType = new GraphQLObjectType<any, ResolverContext>({
  name: "UpdateArtworkImportDimensionMetricFailure",
  isTypeOf: (data) => data._type === "GravityMutationError",
  fields: () => ({
    mutationError: {
      type: GravityMutationErrorType,
      resolve: (err) => err,
    },
  }),
})

const ResponseOrErrorType = new GraphQLUnionType({
  name: "UpdateArtworkImportDimensionMetricResponseOrError",
  types: [SuccessType, FailureType],
})

export const UpdateArtworkImportDimensionMetricMutation = mutationWithClientMutationId<
  any,
  any,
  ResolverContext
>({
  name: "UpdateArtworkImportDimensionMetric",
  inputFields: {
    artworkImportID: {
      type: new GraphQLNonNull(GraphQLString),
    },
    fromDimensionMetric: {
      type: new GraphQLNonNull(GraphQLString),
    },
    toDimensionMetric: {
      type: new GraphQLNonNull(GraphQLString),
    },
  },
  outputFields: {
    updateArtworkImportDimensionMetricOrError: {
      type: ResponseOrErrorType,
      resolve: (result) => result,
    },
  },
  mutateAndGetPayload: async (
    { artworkImportID, fromDimensionMetric, toDimensionMetric },
    { artworkImportUpdateDimensionMetricLoader }
  ) => {
    if (!artworkImportUpdateDimensionMetricLoader) {
      throw new Error("This operation requires an `X-Access-Token` header.")
    }

    try {
      return await artworkImportUpdateDimensionMetricLoader(artworkImportID, {
        from_dimension_metric: fromDimensionMetric,
        to_dimension_metric: toDimensionMetric,
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
