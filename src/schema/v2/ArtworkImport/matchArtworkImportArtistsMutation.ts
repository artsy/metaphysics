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
  name: "MatchArtworkImportArtistsSuccess",
  isTypeOf: (data) => !!data.artworkImportID,
  fields: () => ({
    artworkImportID: {
      type: new GraphQLNonNull(GraphQLString),
    },
    matched: {
      type: new GraphQLNonNull(GraphQLInt),
    },
    unmatched: {
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
  name: "MatchArtworkImportArtistsFailure",
  isTypeOf: (data) => data._type === "GravityMutationError",
  fields: () => ({
    mutationError: {
      type: GravityMutationErrorType,
      resolve: (err) => err,
    },
  }),
})

const ResponseOrErrorType = new GraphQLUnionType({
  name: "MatchArtworkImportArtistsResponseOrError",
  types: [SuccessType, FailureType],
})

export const MatchArtworkImportArtistsMutation = mutationWithClientMutationId<
  any,
  any,
  ResolverContext
>({
  name: "MatchArtworkImportArtists",
  inputFields: {
    artworkImportID: {
      type: new GraphQLNonNull(GraphQLString),
    },
  },
  outputFields: {
    matchArtworkImportArtistsOrError: {
      type: ResponseOrErrorType,
      resolve: (result) => result,
    },
  },
  mutateAndGetPayload: async (
    { artworkImportID },
    { artworkImportMatchArtistsLoader }
  ) => {
    if (!artworkImportMatchArtistsLoader) {
      throw new Error("This operation requires an `X-Access-Token` header.")
    }

    try {
      const { matched, unmatched } = await artworkImportMatchArtistsLoader(
        artworkImportID
      )

      return {
        matched,
        unmatched,
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
