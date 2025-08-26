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
  name: "UpdateArtworkImportRowV2Success",
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
  name: "UpdateArtworkImportRowV2Failure",
  isTypeOf: (data) => data._type === "GravityMutationError",
  fields: () => ({
    mutationError: {
      type: GravityMutationErrorType,
      resolve: (err) => err,
    },
  }),
})

const ResponseOrErrorType = new GraphQLUnionType({
  name: "UpdateArtworkImportRowV2ResponseOrError",
  types: [SuccessType, FailureType],
})

export const UpdateArtworkImportRowV2Mutation = mutationWithClientMutationId<
  any,
  any,
  ResolverContext
>({
  name: "UpdateArtworkImportRowV2",
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
    updateArtworkImportRowV2OrError: {
      type: ResponseOrErrorType,
      resolve: (result) => result,
    },
  },
  mutateAndGetPayload: async (
    { artworkImportID, rowID, fieldName, fieldValue, excludedFromImport },
    { artworkImportV2UpdateRowLoader }
  ) => {
    if (!artworkImportV2UpdateRowLoader) {
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
      await artworkImportV2UpdateRowLoader(
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
