import {
  GraphQLString,
  GraphQLObjectType,
  GraphQLUnionType,
  GraphQLNonNull,
  GraphQLBoolean,
} from "graphql"
import { mutationWithClientMutationId } from "graphql-relay"
import { ResolverContext } from "types/graphql"
import {
  formatGravityError,
  GravityMutationErrorType,
} from "lib/gravityErrorHandler"
import { ArtworkImportType } from "../artworkImport"

const SuccessType = new GraphQLObjectType<any, ResolverContext>({
  name: "UpdateArtworkImportRowSuccess",
  isTypeOf: (data) => !!data.artworkImportID,
  fields: () => ({
    artworkImportID: {
      type: new GraphQLNonNull(GraphQLString),
    },
    artworkImport: {
      type: ArtworkImportType,
      resolve: ({ artworkImportID }, _args, { artworkImportLoader }) => {
        if (!artworkImportLoader) return null
        return artworkImportLoader(artworkImportID)
      },
    },
  }),
})

const FailureType = new GraphQLObjectType<any, ResolverContext>({
  name: "UpdateArtworkImportRowFailure",
  isTypeOf: (data) => data._type === "GravityMutationError",
  fields: () => ({
    mutationError: {
      type: GravityMutationErrorType,
      resolve: (err) => err,
    },
  }),
})

const ResponseOrErrorType = new GraphQLUnionType({
  name: "UpdateArtworkImportRowResponseOrError",
  types: [SuccessType, FailureType],
})

export const UpdateArtworkImportRowMutation = mutationWithClientMutationId<
  any,
  any,
  ResolverContext
>({
  name: "UpdateArtworkImportRow",
  inputFields: {
    artworkImportID: {
      type: new GraphQLNonNull(GraphQLString),
    },
    rowID: {
      type: new GraphQLNonNull(GraphQLString),
    },
    fieldName: {
      type: GraphQLString,
      description: "Name of the field to update",
    },
    fieldValue: {
      type: GraphQLString,
      description: "New value for the field",
    },
    excludedFromImport: {
      type: GraphQLBoolean,
      description: "Whether to exclude this row from import",
    },
  },
  outputFields: {
    updateArtworkImportRowOrError: {
      type: ResponseOrErrorType,
      resolve: (result) => result,
    },
  },
  mutateAndGetPayload: async (
    { artworkImportID, rowID, fieldName, fieldValue, excludedFromImport },
    { artworkImportUpdateRowLoader }
  ) => {
    if (!artworkImportUpdateRowLoader) {
      throw new Error("This operation requires an `X-Access-Token` header.")
    }

    const updateParams: any = {}

    if (fieldName && fieldValue !== undefined) {
      updateParams.field_name = fieldName
      updateParams.field_value = fieldValue
    }

    if (excludedFromImport !== undefined) {
      updateParams.excluded_from_import = excludedFromImport
    }

    try {
      await artworkImportUpdateRowLoader(
        { artworkImportID, rowID },
        updateParams
      )

      return {
        artworkImportID,
      }
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
