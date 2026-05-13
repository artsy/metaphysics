import {
  GraphQLList,
  GraphQLNonNull,
  GraphQLObjectType,
  GraphQLString,
  GraphQLUnionType,
} from "graphql"
import { mutationWithClientMutationId } from "graphql-relay"
import {
  formatGravityError,
  GravityMutationErrorType,
} from "lib/gravityErrorHandler"
import { ResolverContext } from "types/graphql"
import Artwork from "schema/v2/artwork"

interface SyncCatalogToArtworkMutationInputProps {
  artworkID: string
}

const SuccessType = new GraphQLObjectType<any, ResolverContext>({
  name: "SyncCatalogToArtworkSuccess",
  isTypeOf: (data) => data._type === "SyncCatalogToArtworkSuccess",
  fields: () => ({
    artwork: {
      type: Artwork.type,
      resolve: (result, _args, { artworkLoader }) => {
        return artworkLoader(result.artworkID)
      },
    },
    syncedFields: {
      type: new GraphQLList(GraphQLString),
      resolve: ({ synced_fields }) => synced_fields,
    },
    syncErrors: {
      type: new GraphQLList(GraphQLString),
      resolve: ({ errors }) => errors,
    },
  }),
})

const FailureType = new GraphQLObjectType<any, ResolverContext>({
  name: "SyncCatalogToArtworkFailure",
  isTypeOf: (data) => data._type === "GravityMutationError",
  fields: () => ({
    mutationError: {
      type: GravityMutationErrorType,
      resolve: (err) => err,
    },
  }),
})

const ResponseOrErrorType = new GraphQLUnionType({
  name: "SyncCatalogToArtworkResponseOrError",
  types: [SuccessType, FailureType],
})

export const syncCatalogToArtworkMutation = mutationWithClientMutationId<
  SyncCatalogToArtworkMutationInputProps,
  any,
  ResolverContext
>({
  name: "SyncCatalogToArtworkMutation",
  description:
    "Syncs catalog artwork (OS) values to the CMS artwork, applying mapping rules for medium, availability, and price.",
  inputFields: {
    artworkID: {
      type: new GraphQLNonNull(GraphQLString),
      description: "The ID of the artwork to sync.",
    },
  },
  outputFields: {
    artworkOrError: {
      type: ResponseOrErrorType,
      description:
        "On success: the synced artwork and any partial errors. On error: the error that occurred.",
      resolve: (result) => result,
    },
  },
  mutateAndGetPayload: async (
    { artworkID },
    { syncCatalogToArtworkLoader }
  ) => {
    if (!syncCatalogToArtworkLoader) {
      return new Error("You need to be signed in to perform this action")
    }

    try {
      const response = await syncCatalogToArtworkLoader(artworkID)
      return { ...response, artworkID, _type: "SyncCatalogToArtworkSuccess" }
    } catch (error) {
      const formattedErr = formatGravityError(error)
      if (formattedErr) {
        return { ...formattedErr, _type: "GravityMutationError" }
      } else {
        throw error instanceof Error ? error : new Error(String(error))
      }
    }
  },
})
