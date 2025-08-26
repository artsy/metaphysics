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
import { ArtworkImportType } from "../artworkImport"

const SuccessType = new GraphQLObjectType<any, ResolverContext>({
  name: "CreateArtworkImportArtistAssignmentsV2Success",
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
  name: "CreateArtworkImportArtistAssignmentsV2Failure",
  isTypeOf: (data) => data._type === "GravityMutationError",
  fields: () => ({
    mutationError: {
      type: GravityMutationErrorType,
      resolve: (err) => err,
    },
  }),
})

const ResponseOrErrorType = new GraphQLUnionType({
  name: "CreateArtworkImportArtistAssignmentsV2ResponseOrError",
  types: [SuccessType, FailureType],
})

export const CreateArtworkImportArtistAssignmentsV2Mutation = mutationWithClientMutationId<
  any,
  any,
  ResolverContext
>({
  name: "CreateArtworkImportArtistAssignmentsV2",
  inputFields: {
    artworkImportID: {
      type: new GraphQLNonNull(GraphQLString),
    },
    artistName: {
      type: new GraphQLNonNull(GraphQLString),
      description: "The unmatched artist name to assign",
    },
    artistID: {
      type: new GraphQLNonNull(GraphQLString),
      description: "The artist ID to assign to the unmatched name",
    },
  },
  outputFields: {
    createArtworkImportArtistAssignmentsV2OrError: {
      type: ResponseOrErrorType,
      resolve: (result) => result,
    },
  },
  mutateAndGetPayload: async (
    { artworkImportID, artistName, artistID },
    { artworkImportV2CreateArtistAssignmentsLoader }
  ) => {
    if (!artworkImportV2CreateArtistAssignmentsLoader) {
      throw new Error("This operation requires an `X-Access-Token` header.")
    }

    try {
      const result = await artworkImportV2CreateArtistAssignmentsLoader(
        artworkImportID,
        {
          artist_name: artistName,
          artist_id: artistID,
        }
      )

      return {
        artworkImportID,
        updatedRowsCount: result.updated_rows_count,
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
