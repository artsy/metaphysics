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
  name: "UpdateArtworkImportRowImageSuccess",
  isTypeOf: (data) => !!data.artworkImportID,
  fields: () => ({
    artworkImportID: {
      type: new GraphQLNonNull(GraphQLString),
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
  name: "UpdateArtworkImportRowImageFailure",
  isTypeOf: (data) => data._type === "GravityMutationError",
  fields: () => ({
    mutationError: {
      type: GravityMutationErrorType,
      resolve: (err) => err,
    },
  }),
})

const ResponseOrErrorType = new GraphQLUnionType({
  name: "UpdateArtworkImportRowImageResponseOrError",
  types: [SuccessType, FailureType],
})

export const UpdateArtworkImportRowImageMutation = mutationWithClientMutationId<
  any,
  any,
  ResolverContext
>({
  name: "UpdateArtworkImportRowImage",
  inputFields: {
    artworkImportID: {
      type: new GraphQLNonNull(GraphQLString),
    },
    imageID: {
      type: new GraphQLNonNull(GraphQLString),
    },
    position: {
      type: new GraphQLNonNull(GraphQLInt),
      description: "New position for the image (0-based)",
    },
  },
  outputFields: {
    updateArtworkImportRowImageOrError: {
      type: ResponseOrErrorType,
      resolve: (result) => result,
    },
  },
  mutateAndGetPayload: async (
    { artworkImportID, imageID, position },
    { artworkImportUpdateImageMatchLoader }
  ) => {
    if (!artworkImportUpdateImageMatchLoader) {
      throw new Error("This operation requires an `X-Access-Token` header.")
    }

    try {
      await artworkImportUpdateImageMatchLoader(
        { artworkImportID, imageID },
        { position }
      )

      return {
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
