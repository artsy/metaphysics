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
  name: "FlagArtworkImportCellSuccess",
  isTypeOf: (data) => !!data.artworkImportID,
  fields: () => ({
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
  name: "FlagArtworkImportCellFailure",
  isTypeOf: (data) => data._type === "GravityMutationError",
  fields: () => ({
    mutationError: {
      type: GravityMutationErrorType,
      resolve: (err) => err,
    },
  }),
})

const ResponseOrErrorType = new GraphQLUnionType({
  name: "FlagArtworkImportCellResponseOrError",
  types: [SuccessType, FailureType],
})

export const FlagArtworkImportCellMutation = mutationWithClientMutationId<
  any,
  any,
  ResolverContext
>({
  name: "FlagArtworkImportCell",
  inputFields: {
    artworkImportID: {
      type: new GraphQLNonNull(GraphQLString),
    },
    rowID: {
      type: new GraphQLNonNull(GraphQLString),
    },
    columnName: {
      type: new GraphQLNonNull(GraphQLString),
    },
    userNote: {
      type: new GraphQLNonNull(GraphQLString),
    },
    flaggedValue: {
      type: GraphQLString,
    },
    originalValue: {
      type: GraphQLString,
    },
  },
  outputFields: {
    flagArtworkImportCellOrError: {
      type: ResponseOrErrorType,
      resolve: (result) => result,
    },
  },
  mutateAndGetPayload: async (
    {
      artworkImportID,
      rowID,
      columnName,
      userNote,
      flaggedValue,
      originalValue,
    },
    { artworkImportFlagCellLoader }
  ) => {
    if (!artworkImportFlagCellLoader) {
      throw new Error("This operation requires an `X-Access-Token` header.")
    }

    try {
      await artworkImportFlagCellLoader(artworkImportID, {
        row_id: rowID,
        column_name: columnName,
        user_note: userNote,
        flagged_value: flaggedValue,
        original_value: originalValue,
      })

      return { artworkImportID }
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
