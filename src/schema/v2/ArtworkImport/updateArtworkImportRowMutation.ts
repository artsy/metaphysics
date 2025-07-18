import {
  GraphQLBoolean,
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
import { ResolverContext } from "types/graphql"
import { ArtworkImportType } from "./artworkImport"

const SuccessType = new GraphQLObjectType<any, ResolverContext>({
  name: "UpdateArtworkImportRowSuccess",
  isTypeOf: (data) => !!data.id,
  fields: () => ({
    success: {
      type: new GraphQLNonNull(GraphQLBoolean),
      resolve: () => true,
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
    artworkImportRowID: {
      type: new GraphQLNonNull(GraphQLString),
    },
    fieldName: {
      type: new GraphQLNonNull(GraphQLString),
    },
    fieldValue: {
      type: GraphQLString,
    },
  },
  outputFields: {
    updateArtworkImportRowOrError: {
      type: ResponseOrErrorType,
      resolve: (result) => result,
    },
  },
  mutateAndGetPayload: async (
    { artworkImportID, fieldName, fieldValue, artworkImportRowID },
    { artworkImportUpdateRowLoader }
  ) => {
    if (!artworkImportUpdateRowLoader) {
      throw new Error("This operation requires an `X-Access-Token` header.")
    }

    try {
      return {
        ...(await artworkImportUpdateRowLoader(artworkImportID, {
          field_name: fieldName,
          field_value: fieldValue,
          row_id: artworkImportRowID,
        })),
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
