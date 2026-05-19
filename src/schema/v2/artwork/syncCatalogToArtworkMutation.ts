import {
  GraphQLEnumType,
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

const CatalogSyncableFieldEnum = new GraphQLEnumType({
  name: "CatalogSyncableField",
  description: "Fields that can be synced from catalog artwork (OS) to CMS.",
  values: {
    AVAILABILITY: { value: "availability" },
    MEDIUM: { value: "medium" },
    PRICE: { value: "price" },
  },
})

interface SyncCatalogToArtworkMutationInputProps {
  artworkID: string
  fields?: string[]
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
    fields: {
      type: new GraphQLList(CatalogSyncableFieldEnum),
      description: "Specific fields to sync. Omit to sync all.",
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
    { artworkID, fields },
    { syncCatalogToArtworkLoader }
  ) => {
    if (!syncCatalogToArtworkLoader) {
      return new Error("You need to be signed in to perform this action")
    }

    try {
      const params = fields?.length ? { fields } : {}
      const response = await syncCatalogToArtworkLoader(artworkID, params)
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
