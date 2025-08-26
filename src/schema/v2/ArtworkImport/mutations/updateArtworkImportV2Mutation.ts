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
import { ArtworkImportType } from "../artworkImport"

const SuccessType = new GraphQLObjectType<any, ResolverContext>({
  name: "UpdateArtworkImportV2Success",
  isTypeOf: (data) => !!data.id,
  fields: () => ({
    artworkImport: {
      type: ArtworkImportType,
      resolve: (result) => result,
    },
  }),
})

const FailureType = new GraphQLObjectType<any, ResolverContext>({
  name: "UpdateArtworkImportV2Failure",
  isTypeOf: (data) => data._type === "GravityMutationError",
  fields: () => ({
    mutationError: {
      type: GravityMutationErrorType,
      resolve: (err) => err,
    },
  }),
})

const ResponseOrErrorType = new GraphQLUnionType({
  name: "UpdateArtworkImportV2ResponseOrError",
  types: [SuccessType, FailureType],
})

export const UpdateArtworkImportV2Mutation = mutationWithClientMutationId<
  any,
  any,
  ResolverContext
>({
  name: "UpdateArtworkImportV2",
  inputFields: {
    artworkImportID: {
      type: new GraphQLNonNull(GraphQLString),
    },
    status: {
      type: GraphQLString,
      description: "Status to update the import to (e.g., 'cancelled')",
    },
    currency: {
      type: GraphQLString,
      description: "Currency to set for all rows in the import",
    },
    dimensionMetric: {
      type: GraphQLString,
      description: "Dimension metric to set for all rows in the import",
    },
    weightMetric: {
      type: GraphQLString,
      description: "Weight metric to set for all rows in the import",
    },
  },
  outputFields: {
    updateArtworkImportV2OrError: {
      type: ResponseOrErrorType,
      resolve: (result) => result,
    },
  },
  mutateAndGetPayload: async (
    { artworkImportID, status, currency, dimensionMetric, weightMetric },
    { artworkImportV2UpdateLoader }
  ) => {
    if (!artworkImportV2UpdateLoader) {
      throw new Error("This operation requires an `X-Access-Token` header.")
    }

    const updateParams: any = {}

    if (status) updateParams.status = status
    if (currency) updateParams.currency = currency
    if (dimensionMetric) updateParams.dimension_metric = dimensionMetric
    if (weightMetric) updateParams.weight_metric = weightMetric

    try {
      return await artworkImportV2UpdateLoader(artworkImportID, updateParams)
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
