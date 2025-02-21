import {
  GraphQLString,
  GraphQLObjectType,
  GraphQLUnionType,
  GraphQLNonNull,
  GraphQLInt,
} from "graphql"
import { mutationWithClientMutationId } from "graphql-relay"
import { ResolverContext } from "types/graphql"
import {
  formatGravityError,
  GravityMutationErrorType,
} from "lib/gravityErrorHandler"
import { ArtworkImportType } from "./artworkImport"

const SuccessType = new GraphQLObjectType<any, ResolverContext>({
  name: "AssignArtworkImportArtistSuccess",
  isTypeOf: (data) => !!data.artworkImportID,
  fields: () => ({
    artworkImportID: {
      type: new GraphQLNonNull(GraphQLString),
    },
    updatedRowsCount: {
      type: new GraphQLNonNull(GraphQLInt),
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
  name: "AssignArtworkImportArtistFailure",
  isTypeOf: (data) => data._type === "GravityMutationError",
  fields: () => ({
    mutationError: {
      type: GravityMutationErrorType,
      resolve: (err) => err,
    },
  }),
})

const ResponseOrErrorType = new GraphQLUnionType({
  name: "AssignArtworkImportArtistResponseOrError",
  types: [SuccessType, FailureType],
})

export const AssignArtworkImportArtistMutation = mutationWithClientMutationId<
  any,
  any,
  ResolverContext
>({
  name: "AssignArtworkImportArtist",
  inputFields: {
    artworkImportID: {
      type: new GraphQLNonNull(GraphQLString),
    },
    artistName: {
      type: new GraphQLNonNull(GraphQLString),
    },
    artistID: {
      type: new GraphQLNonNull(GraphQLString),
    },
  },
  outputFields: {
    assignArtworkImportArtistOrError: {
      type: ResponseOrErrorType,
      resolve: (result) => result,
    },
  },
  mutateAndGetPayload: async (
    { artworkImportID, artistName, artistID },
    { artworkImportAssignArtistLoader }
  ) => {
    if (!artworkImportAssignArtistLoader) {
      throw new Error("This operation requires an `X-Access-Token` header.")
    }

    try {
      const { updated_rows_count } = await artworkImportAssignArtistLoader(
        artworkImportID,
        {
          artist_name: artistName,
          artist_id: artistID,
        }
      )

      return {
        updatedRowsCount: updated_rows_count,
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
