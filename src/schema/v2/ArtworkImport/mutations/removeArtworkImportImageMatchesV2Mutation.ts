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
  name: "RemoveArtworkImportImageMatchesV2Success",
  isTypeOf: (data) => data.success === true,
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
  name: "RemoveArtworkImportImageMatchesV2Failure",
  isTypeOf: (data) => data._type === "GravityMutationError",
  fields: () => ({
    mutationError: {
      type: GravityMutationErrorType,
      resolve: (err) => err,
    },
  }),
})

const ResponseOrErrorType = new GraphQLUnionType({
  name: "RemoveArtworkImportImageMatchesV2ResponseOrError",
  types: [SuccessType, FailureType],
})

export const RemoveArtworkImportImageMatchesV2Mutation = mutationWithClientMutationId<
  any,
  any,
  ResolverContext
>({
  name: "RemoveArtworkImportImageMatchesV2",
  inputFields: {
    artworkImportID: {
      type: new GraphQLNonNull(GraphQLString),
    },
    imageID: {
      type: new GraphQLNonNull(GraphQLString),
      description: "ID of the image match to remove",
    },
  },
  outputFields: {
    removeArtworkImportImageMatchesV2OrError: {
      type: ResponseOrErrorType,
      resolve: (result) => result,
    },
  },
  mutateAndGetPayload: async (
    { artworkImportID, imageID },
    { artworkImportV2RemoveImageMatchesLoader }
  ) => {
    if (!artworkImportV2RemoveImageMatchesLoader) {
      throw new Error("This operation requires an `X-Access-Token` header.")
    }

    try {
      await artworkImportV2RemoveImageMatchesLoader(
        { artworkImportID, imageID },
        {}
      )

      return {
        success: true,
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
