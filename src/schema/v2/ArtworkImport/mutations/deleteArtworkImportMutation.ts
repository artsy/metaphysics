import {
  GraphQLString,
  GraphQLObjectType,
  GraphQLUnionType,
  GraphQLNonNull,
  GraphQLBoolean,
  GraphQLInt,
  GraphQLList,
} from "graphql"
import { mutationWithClientMutationId } from "graphql-relay"
import { ResolverContext } from "types/graphql"
import {
  formatGravityError,
  GravityMutationErrorType,
} from "lib/gravityErrorHandler"

const SuccessType = new GraphQLObjectType<any, ResolverContext>({
  name: "DeleteArtworkImportSuccess",
  isTypeOf: (data) => data.success !== undefined,
  fields: () => ({
    success: {
      type: GraphQLBoolean,
      resolve: ({ success }) => success,
    },
    deletedArtworksCount: {
      type: GraphQLInt,
      resolve: ({ deleted_artworks_count }) => deleted_artworks_count,
    },
    deletedSaleArtworksCount: {
      type: GraphQLInt,
      resolve: ({ deleted_sale_artworks_count }) => deleted_sale_artworks_count,
    },
    deletedArtworkIds: {
      type: new GraphQLList(GraphQLString),
      resolve: ({ deleted_artwork_ids }) => deleted_artwork_ids,
    },
    deletedSaleArtworkIds: {
      type: new GraphQLList(GraphQLInt),
      resolve: ({ deleted_sale_artwork_ids }) => deleted_sale_artwork_ids,
    },
    importCanceled: {
      type: GraphQLBoolean,
      resolve: ({ import_canceled }) => import_canceled,
    },
    errors: {
      type: new GraphQLList(GraphQLString),
      resolve: ({ errors }) => errors,
    },
  }),
})

const FailureType = new GraphQLObjectType<any, ResolverContext>({
  name: "DeleteArtworkImportFailure",
  isTypeOf: (data) => data._type === "GravityMutationError",
  fields: () => ({
    mutationError: {
      type: GravityMutationErrorType,
      resolve: (err) => err,
    },
  }),
})

const ResponseOrErrorType = new GraphQLUnionType({
  name: "DeleteArtworkImportResponseOrError",
  types: [SuccessType, FailureType],
})

export const DeleteArtworkImportMutation = mutationWithClientMutationId<
  any,
  any,
  ResolverContext
>({
  name: "DeleteArtworkImport",
  description:
    "Delete an artwork import and all associated artworks and sale artworks",
  inputFields: {
    artworkImportID: {
      type: new GraphQLNonNull(GraphQLString),
    },
  },
  outputFields: {
    artworkImportOrError: {
      type: ResponseOrErrorType,
      resolve: (result) => result,
    },
  },
  mutateAndGetPayload: async (args, { deleteArtworkImportLoader }) => {
    if (!deleteArtworkImportLoader) {
      throw new Error("This operation requires an `X-Access-Token` header.")
    }

    try {
      const result = await deleteArtworkImportLoader(args.artworkImportID)
      return result
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
