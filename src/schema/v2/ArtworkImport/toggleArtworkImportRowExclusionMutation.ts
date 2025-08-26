// DEPRECATED: This mutation is deprecated. Use UpdateArtworkImportRowV2 instead.
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
import { ArtworkImportType } from "./artworkImport"

const SuccessType = new GraphQLObjectType<any, ResolverContext>({
  name: "ToggleArtworkImportRowExclusionSuccess",
  isTypeOf: (data) => !!data.id,
  fields: () => ({
    artworkImport: {
      type: ArtworkImportType,
      resolve: (result) => result,
    },
  }),
})

const FailureType = new GraphQLObjectType<any, ResolverContext>({
  name: "ToggleArtworkImportRowExclusionFailure",
  isTypeOf: (data) => data._type === "GravityMutationError",
  fields: () => ({
    mutationError: {
      type: GravityMutationErrorType,
      resolve: (err) => err,
    },
  }),
})

const ResponseOrErrorType = new GraphQLUnionType({
  name: "ToggleArtworkImportRowExclusionResponseOrError",
  types: [SuccessType, FailureType],
})

export const ToggleArtworkImportRowExclusionMutation = mutationWithClientMutationId<
  any,
  any,
  ResolverContext
>({
  name: "ToggleArtworkImportRowExclusion",
  deprecationReason:
    "This mutation is deprecated. Use UpdateArtworkImportRowV2 instead.",
  inputFields: {
    artworkImportID: {
      type: new GraphQLNonNull(GraphQLString),
    },
    artworkImportRowID: {
      type: new GraphQLNonNull(GraphQLString),
    },
    excludedFromImport: {
      type: new GraphQLNonNull(GraphQLBoolean),
    },
  },
  outputFields: {
    toggleArtworkImportRowExclusionOrError: {
      type: ResponseOrErrorType,
      resolve: (result) => result,
    },
  },
  mutateAndGetPayload: async (
    { artworkImportID, artworkImportRowID, excludedFromImport },
    { artworkImportToggleRowExclusionLoader }
  ) => {
    if (!artworkImportToggleRowExclusionLoader) {
      throw new Error("This operation requires an `X-Access-Token` header.")
    }

    try {
      return await artworkImportToggleRowExclusionLoader(artworkImportID, {
        row_id: artworkImportRowID,
        excluded_from_import: excludedFromImport,
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
