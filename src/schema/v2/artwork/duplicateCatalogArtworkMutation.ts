import {
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

interface DuplicateCatalogArtworkMutationInputProps {
  artworkID: string
}

const SuccessType = new GraphQLObjectType<any, ResolverContext>({
  name: "DuplicateCatalogArtworkSuccess",
  isTypeOf: (data) => data._type === "DuplicateCatalogArtworkSuccess",
  fields: () => ({
    artwork: {
      type: Artwork.type,
      resolve: ({ id }, _args, { artworkLoader }) => artworkLoader(id),
    },
  }),
})

const FailureType = new GraphQLObjectType<any, ResolverContext>({
  name: "DuplicateCatalogArtworkFailure",
  isTypeOf: (data) => data._type === "GravityMutationError",
  fields: () => ({
    mutationError: {
      type: GravityMutationErrorType,
      resolve: (err) => err,
    },
  }),
})

const ResponseOrErrorType = new GraphQLUnionType({
  name: "DuplicateCatalogArtworkResponseOrError",
  types: [SuccessType, FailureType],
})

export const duplicateCatalogArtworkMutation = mutationWithClientMutationId<
  DuplicateCatalogArtworkMutationInputProps,
  any,
  ResolverContext
>({
  name: "DuplicateCatalogArtworkMutation",
  description:
    "Duplicates an OS inventory (catalog) artwork's OS-editable fields into a new, inventory-only artwork.",
  inputFields: {
    artworkID: {
      type: new GraphQLNonNull(GraphQLString),
      description: "The ID of the artwork to duplicate.",
    },
  },
  outputFields: {
    artworkOrError: {
      type: ResponseOrErrorType,
      description:
        "On success: the newly created duplicate artwork. On error: the error that occurred.",
      resolve: (result) => result,
    },
  },
  mutateAndGetPayload: async (
    { artworkID },
    { duplicateCatalogArtworkLoader }
  ) => {
    if (!duplicateCatalogArtworkLoader) {
      return new Error("You need to be signed in to perform this action")
    }

    try {
      const response = await duplicateCatalogArtworkLoader(artworkID)
      return { ...response, _type: "DuplicateCatalogArtworkSuccess" }
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
