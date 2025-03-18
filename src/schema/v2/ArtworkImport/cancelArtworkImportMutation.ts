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
  name: "CancelArtworkImportSuccess",
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
  name: "CancelArtworkImportFailure",
  isTypeOf: (data) => data._type === "GravityMutationError",
  fields: () => ({
    mutationError: {
      type: GravityMutationErrorType,
      resolve: (err) => err,
    },
  }),
})

const ResponseOrErrorType = new GraphQLUnionType({
  name: "CancelArtworkImportResponseOrError",
  types: [SuccessType, FailureType],
})

export const CancelArtworkImportMutation = mutationWithClientMutationId<
  any,
  any,
  ResolverContext
>({
  name: "CancelArtworkImport",
  inputFields: {
    artworkImportID: {
      type: new GraphQLNonNull(GraphQLString),
    },
  },
  outputFields: {
    cancelArtworkImportOrError: {
      type: ResponseOrErrorType,
      resolve: (result) => result,
    },
  },
  mutateAndGetPayload: async (
    { artworkImportID },
    { cancelArtworkImportLoader }
  ) => {
    if (!cancelArtworkImportLoader) {
      throw new Error("This operation requires an `X-Access-Token` header.")
    }

    try {
      await cancelArtworkImportLoader(artworkImportID)

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
