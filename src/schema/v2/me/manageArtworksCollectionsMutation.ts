import {
  GraphQLObjectType,
  GraphQLUnionType,
  GraphQLNonNull,
  GraphQLString,
  GraphQLList,
} from "graphql"
import { mutationWithClientMutationId } from "graphql-relay"
import {
  formatGravityError,
  GravityMutationErrorType,
} from "lib/gravityErrorHandler"
import { ResolverContext } from "types/graphql"
import { CollectionType } from "./collection"
import numeral from "../fields/numeral"

const SuccessType = new GraphQLObjectType<any, ResolverContext>({
  name: "ManageArtworksCollectionsSuccess",
  isTypeOf: (data) => data.counts,
  fields: () => ({
    counts: {
      type: new GraphQLObjectType<any, ResolverContext>({
        name: "ManageArtworksCollectionsCounts",
        fields: {
          artworks: numeral(({ artworks }) => artworks),
          addedToCollections: numeral(({ added_to }) => added_to),
          removedFromCollections: numeral(({ removed_from }) => removed_from),
        },
      }),
      resolve: (response) => {
        return response.counts
      },
    },
    addedToCollections: {
      type: new GraphQLList(CollectionType),
      resolve: (response) => {
        return response.added_to
      },
    },
    removedFromCollections: {
      type: new GraphQLList(CollectionType),
      resolve: (response) => {
        return response.removed_from
      },
    },
  }),
})

const ErrorType = new GraphQLObjectType<any, ResolverContext>({
  name: "ManageArtworksCollectionsFailure",
  isTypeOf: (data) => {
    return data._type === "GravityMutationError"
  },
  fields: () => ({
    mutationError: {
      type: GravityMutationErrorType,
      resolve: (err) => (typeof err.message === "object" ? err.message : err),
    },
  }),
})

const ResponseOrErrorType = new GraphQLUnionType({
  name: "ManageArtworksCollectionsResponseOrError",
  types: [SuccessType, ErrorType],
})

interface InputProps {
  artworkIDs: string[]
  addToCollectionIDs: string[]
  removeFromCollectionIDs: string[]
}

export const manageArtworksCollectionsMutation = mutationWithClientMutationId<
  InputProps,
  any,
  ResolverContext
>({
  name: "manageArtworksCollections",
  description: "Add / remove artworks to / from collections",
  inputFields: {
    artworkIDs: {
      type: new GraphQLNonNull(
        new GraphQLList(new GraphQLNonNull(GraphQLString))
      ),
      description: "Artwork ids or slugs.",
    },
    addToCollectionIDs: {
      type: new GraphQLList(new GraphQLNonNull(GraphQLString)),
      description: "Collection ids. To which collections to add artworks.",
    },
    removeFromCollectionIDs: {
      type: new GraphQLList(new GraphQLNonNull(GraphQLString)),
      description: "Collection ids. From which collections to remove artworks.",
    },
  },
  outputFields: {
    responseOrError: {
      type: ResponseOrErrorType,
      resolve: (result) => result,
    },
  },
  mutateAndGetPayload: async (args, context) => {
    if (!context.manageArtworksCollectionsLoader) {
      throw new Error("You need to be signed in to perform this action")
    }

    try {
      const response = await context.manageArtworksCollectionsLoader({
        artwork_ids: args.artworkIDs,
        add_to: args.addToCollectionIDs,
        remove_from: args.removeFromCollectionIDs,
      })

      return response
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
