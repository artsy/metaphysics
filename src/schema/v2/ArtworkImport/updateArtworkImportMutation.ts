import {
  GraphQLString,
  GraphQLObjectType,
  GraphQLNonNull,
  GraphQLUnionType,
  GraphQLBoolean,
} from "graphql"
import { mutationWithClientMutationId } from "graphql-relay"
import { ResolverContext } from "types/graphql"
import {
  formatGravityError,
  GravityMutationErrorType,
} from "lib/gravityErrorHandler"
import { ArtworkImportType } from "./artworkImport"

const SuccessType = new GraphQLObjectType<any, ResolverContext>({
  name: "UpdateArtworkImportSuccess",
  isTypeOf: (data) => !!data.id,
  fields: () => ({
    success: {
      type: new GraphQLNonNull(GraphQLBoolean),
      resolve: () => true,
    },
    artworkImport: {
      type: ArtworkImportType,
      resolve: (result) => {
        if (result.id) {
          return result
        }
      },
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
    currency: {
      type: GraphQLString,
    },
    dimensionMetric: {
      type: GraphQLString,
    },
  },
  outputFields: {
    artworkImportOrError: {
      type: ResponseOrErrorType,
      resolve: (result) => result,
    },
  },
  mutateAndGetPayload: async (
    { currency, dimensionMetric },
    { artworkImportUpdateLoader }
  ) => {
    if (!artworkImportUpdateLoader) {
      throw new Error("This operation requires an `X-Access-Token` header.")
    }

    const gravityArgs = {
      currency: currency,
      dimension_metric: dimensionMetric,
    }

    try {
      const result = await artworkImportUpdateLoader(gravityArgs)
      return result
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
