import {
  GraphQLString,
  GraphQLObjectType,
  GraphQLUnionType,
  GraphQLNonNull,
  GraphQLInt,
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
  name: "CreateArtworkImportArtworksSuccess",
  isTypeOf: (data) => !!data.artworkImportID || !!data.queued,
  fields: () => ({
    artworkImportID: {
      type: new GraphQLNonNull(GraphQLString),
    },
    createdArtworksCount: {
      type: new GraphQLNonNull(GraphQLInt),
    },
    artworkImport: {
      type: ArtworkImportType,
      resolve: ({ artworkImportID }, _args, { artworkImportLoader }) => {
        if (!artworkImportLoader) return null
        return artworkImportLoader(artworkImportID)
      },
    },
    queued: {
      type: GraphQLBoolean,
      resolve: ({ queued }) => queued,
    },
  }),
})

const FailureType = new GraphQLObjectType<any, ResolverContext>({
  name: "CreateArtworkImportArtworksFailure",
  isTypeOf: (data) => data._type === "GravityMutationError",
  fields: () => ({
    mutationError: {
      type: GravityMutationErrorType,
      resolve: (err) => err,
    },
  }),
})

const ResponseOrErrorType = new GraphQLUnionType({
  name: "CreateArtworkImportArtworksResponseOrError",
  types: [SuccessType, FailureType],
})

export const CreateArtworkImportArtworksMutation = mutationWithClientMutationId<
  any,
  any,
  ResolverContext
>({
  name: "CreateArtworkImportArtworks",
  inputFields: {
    async: {
      type: GraphQLBoolean,
    },
    artworkImportID: {
      type: new GraphQLNonNull(GraphQLString),
    },
  },
  outputFields: {
    createArtworkImportArtworksOrError: {
      type: ResponseOrErrorType,
      resolve: (result) => result,
    },
  },
  mutateAndGetPayload: async (
    { artworkImportID, async },
    { artworkImportCreateArtworksLoader }
  ) => {
    if (!artworkImportCreateArtworksLoader) {
      throw new Error("This operation requires an `X-Access-Token` header.")
    }

    const gravityArgs: any = {}
    if (async) gravityArgs.async = async

    try {
      const result = await artworkImportCreateArtworksLoader(
        artworkImportID,
        gravityArgs
      )

      return {
        artworkImportID: artworkImportID,
        createdArtworksCount: result.created || 0,
        queued: result.queued,
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
