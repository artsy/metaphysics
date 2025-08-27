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
  name: "UpdateArtworkImportSuccess",
  isTypeOf: (data) => !!data.id,
  fields: () => ({
    artworkImport: {
      type: ArtworkImportType,
      resolve: (result) => result,
    },
  }),
})

const FailureType = new GraphQLObjectType<any, ResolverContext>({
  name: "UpdateArtworkImportFailure",
  isTypeOf: (data) => data._type === "GravityMutationError",
  fields: () => ({
    mutationError: {
      type: GravityMutationErrorType,
      resolve: (err) => err,
    },
  }),
})

const ResponseOrErrorType = new GraphQLUnionType({
  name: "UpdateArtworkImportResponseOrError",
  types: [SuccessType, FailureType],
})

export const UpdateArtworkImportMutation = mutationWithClientMutationId<
  any,
  any,
  ResolverContext
>({
  name: "UpdateArtworkImport",
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
    locationID: {
      type: GraphQLString,
      description: "Preferred location ID for the artwork import",
    },
  },
  outputFields: {
    updateArtworkImportOrError: {
      type: ResponseOrErrorType,
      resolve: (result) => result,
    },
  },
  mutateAndGetPayload: async (
    {
      artworkImportID,
      status,
      currency,
      dimensionMetric,
      weightMetric,
      locationID,
    },
    { artworkImportUpdateLoader }
  ) => {
    if (!artworkImportUpdateLoader) {
      throw new Error("This operation requires an `X-Access-Token` header.")
    }

    const updateParams: any = {}

    if (status) updateParams.status = status
    if (currency) updateParams.currency = currency
    if (dimensionMetric) updateParams.dimension_metric = dimensionMetric
    if (weightMetric) updateParams.weight_metric = weightMetric
    if (locationID) updateParams.location_id = locationID

    try {
      return await artworkImportUpdateLoader(artworkImportID, updateParams)
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
