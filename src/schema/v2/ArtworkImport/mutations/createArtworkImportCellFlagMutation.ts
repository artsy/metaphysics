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
  name: "CreateArtworkImportCellFlagSuccess",
  isTypeOf: (data) =>
    !!data.artworkImportID && data._type !== "GravityMutationError",
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
  name: "CreateArtworkImportCellFlagFailure",
  isTypeOf: (data) => data._type === "GravityMutationError",
  fields: () => ({
    mutationError: {
      type: GravityMutationErrorType,
      resolve: (err) => err,
    },
  }),
})

const ResponseOrErrorType = new GraphQLUnionType({
  name: "CreateArtworkImportCellFlagResponseOrError",
  types: [SuccessType, FailureType],
})

export const CreateArtworkImportCellFlagMutation = mutationWithClientMutationId<
  any,
  any,
  ResolverContext
>({
  name: "CreateArtworkImportCellFlag",
  inputFields: {
    artworkImportID: {
      type: new GraphQLNonNull(GraphQLString),
    },
    rowID: {
      type: new GraphQLNonNull(GraphQLString),
      description: "ID of the row containing the cell to flag",
    },
    columnName: {
      type: new GraphQLNonNull(GraphQLString),
      description: "Name of the column containing the cell to flag",
    },
    flaggedValue: {
      type: new GraphQLNonNull(GraphQLString),
      description: "The value being flagged",
    },
    originalValue: {
      type: GraphQLString,
      description: "The original value before flagging",
    },
    userNote: {
      type: GraphQLString,
      description: "User note explaining why the cell was flagged",
    },
  },
  outputFields: {
    createArtworkImportCellFlagOrError: {
      type: ResponseOrErrorType,
      resolve: (result) => result,
    },
  },
  mutateAndGetPayload: async (
    {
      artworkImportID,
      rowID,
      columnName,
      flaggedValue,
      originalValue,
      userNote,
    },
    { artworkImportCreateCellFlagLoader }
  ) => {
    if (!artworkImportCreateCellFlagLoader) {
      throw new Error("This operation requires an `X-Access-Token` header.")
    }

    const flagData: any = {
      row_id: rowID,
      column_name: columnName,
      flagged_value: flaggedValue,
    }

    if (originalValue) flagData.original_value = originalValue
    if (userNote) flagData.user_note = userNote

    try {
      return {
        ...(await artworkImportCreateCellFlagLoader(artworkImportID, flagData)),
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
