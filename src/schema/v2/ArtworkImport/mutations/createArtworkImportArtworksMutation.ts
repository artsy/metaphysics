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
  name: "CreateArtworkImportArtworksSuccess",
  isTypeOf: (data) => !!data.queued,
  fields: () => ({
    queued: {
      type: new GraphQLNonNull(GraphQLBoolean),
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
    { artworkImportID },
    { artworkImportCreateArtworksLoader }
  ) => {
    if (!artworkImportCreateArtworksLoader) {
      throw new Error("This operation requires an `X-Access-Token` header.")
    }

    try {
      const result = await artworkImportCreateArtworksLoader(
        artworkImportID,
        {}
      )

      return {
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
