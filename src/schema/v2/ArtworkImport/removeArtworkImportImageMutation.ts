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
  name: "RemoveArtworkImportImageSuccess",
  isTypeOf: (data) => !!data.id,
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
  name: "RemoveArtworkImportImageFailure",
  isTypeOf: (data) => data._type === "GravityMutationError",
  fields: () => ({
    mutationError: {
      type: GravityMutationErrorType,
      resolve: (err) => err,
    },
  }),
})

const ResponseOrErrorType = new GraphQLUnionType({
  name: "RemoveArtworkImportImageResponseOrError",
  types: [SuccessType, FailureType],
})

export const RemoveArtworkImportImageMutation = mutationWithClientMutationId<
  any,
  any,
  ResolverContext
>({
  name: "RemoveArtworkImportImage",
  inputFields: {
    artworkImportID: {
      type: new GraphQLNonNull(GraphQLString),
    },
    rowID: {
      type: new GraphQLNonNull(GraphQLString),
      description: "The ID of the row containing the image",
    },
    imageID: {
      type: new GraphQLNonNull(GraphQLString),
    },
  },
  outputFields: {
    removeArtworkImportImageOrError: {
      type: ResponseOrErrorType,
      resolve: (result) => result,
    },
  },
  mutateAndGetPayload: async (
    { artworkImportID, rowID, imageID },
    { artworkImportRemoveImageLoader }
  ) => {
    if (!artworkImportRemoveImageLoader) {
      throw new Error("This operation requires an `X-Access-Token` header.")
    }

    try {
      return {
        ...(await artworkImportRemoveImageLoader({
          artworkImportID,
          rowID,
          imageID,
        })),
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
