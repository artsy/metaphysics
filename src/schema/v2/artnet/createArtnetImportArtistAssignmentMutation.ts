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
import { ArtnetImportType } from "./artnetImport"

const SuccessType = new GraphQLObjectType<any, ResolverContext>({
  name: "CreateArtnetImportArtistAssignmentSuccess",
  isTypeOf: (data) => !!data.artnetImportID,
  fields: () => ({
    artnetImportID: {
      type: new GraphQLNonNull(GraphQLString),
    },
    matchedRowsCount: {
      type: new GraphQLNonNull(GraphQLInt),
    },
    updatedArtworksCount: {
      type: new GraphQLNonNull(GraphQLInt),
    },
    artnetImport: {
      type: ArtnetImportType,
      resolve: ({ artnetImportID }, _args, { artnetImportLoader }) => {
        if (!artnetImportLoader) return null
        return artnetImportLoader(artnetImportID)
      },
    },
  }),
})

const FailureType = new GraphQLObjectType<any, ResolverContext>({
  name: "CreateArtnetImportArtistAssignmentFailure",
  isTypeOf: (data) => data._type === "GravityMutationError",
  fields: () => ({
    mutationError: {
      type: GravityMutationErrorType,
      resolve: (err) => err,
    },
  }),
})

const ResponseOrErrorType = new GraphQLUnionType({
  name: "CreateArtnetImportArtistAssignmentResponseOrError",
  types: [SuccessType, FailureType],
})

export const CreateArtnetImportArtistAssignmentMutation = mutationWithClientMutationId<
  any,
  any,
  ResolverContext
>({
  name: "CreateArtnetImportArtistAssignment",
  inputFields: {
    artnetImportID: {
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
    createArtnetImportArtistAssignmentOrError: {
      type: ResponseOrErrorType,
      resolve: (result) => result,
    },
  },
  mutateAndGetPayload: async (
    { artnetImportID, artistName, artistID },
    { artnetImportCreateArtistAssignmentLoader }
  ) => {
    if (!artnetImportCreateArtistAssignmentLoader) {
      throw new Error("This operation requires an `X-Access-Token` header.")
    }

    try {
      const result = await artnetImportCreateArtistAssignmentLoader(
        artnetImportID,
        {
          artist_name: artistName,
          artist_id: artistID,
        }
      )

      return {
        artnetImportID,
        matchedRowsCount: result.matched_rows_count,
        updatedArtworksCount: result.updated_artworks_count,
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
