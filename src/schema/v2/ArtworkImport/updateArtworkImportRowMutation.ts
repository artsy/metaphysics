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

const SuccessType = new GraphQLObjectType<any, ResolverContext>({
  name: "UpdateArtworkImportRowSuccess",
  isTypeOf: (data) => !!data.id,
  fields: () => ({
    success: {
      type: new GraphQLNonNull(GraphQLBoolean),
      resolve: () => true,
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
      type: new GraphQLNonNull(GraphQLString),
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
      return artworkImportUpdateRowLoader(artworkImportID, {
        field_name: fieldName,
        field_value: fieldValue,
        row_id: artworkImportRowID,
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
