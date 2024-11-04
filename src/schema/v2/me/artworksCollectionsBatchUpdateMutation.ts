import {
  GraphQLObjectType,
  GraphQLUnionType,
  GraphQLNonNull,
  GraphQLString,
  GraphQLList,
  GraphQLInt,
} from "graphql"
import { mutationWithClientMutationId } from "graphql-relay"
import {
  formatGravityError,
  GravityMutationErrorType,
} from "lib/gravityErrorHandler"
import { ResolverContext } from "types/graphql"
import { CollectionType } from "./collection"
import { ArtworkType } from "../artwork"

const SuccessType = new GraphQLObjectType<any, ResolverContext>({
  name: "ArtworksCollectionsBatchUpdateSuccess",
  isTypeOf: (data) => data.counts,
  fields: () => ({
    artwork: {
      type: ArtworkType,
      resolve: ({ artworkID }, _, { artworkLoader }) =>
        artworkLoader(artworkID),
    },
    counts: {
      type: new GraphQLObjectType<any, ResolverContext>({
        name: "ArtworksCollectionsBatchUpdateCounts",
        fields: {
          artworks: {
            type: GraphQLInt,
            resolve: ({ artworks }) => artworks,
          },
          addedToCollections: {
            type: GraphQLInt,
            resolve: ({ added_to }) => added_to,
          },
          removedFromCollections: {
            type: GraphQLInt,
            resolve: ({ removed_from }) => removed_from,
          },
        },
      }),
      resolve: (response) => {
        return response.counts
      },
    },
    addedToCollections: {
      type: new GraphQLList(CollectionType),
      resolve: (response, _, context) => {
        return response.added_to.map((entity) => {
          return {
            ...entity,
            userID: context.userID,
          }
        })
      },
    },
    removedFromCollections: {
      type: new GraphQLList(CollectionType),
      resolve: (response, _, context) => {
        return response.removed_from.map((entity) => {
          return {
            ...entity,
            userID: context.userID,
          }
        })
      },
    },
  }),
})

const ErrorType = new GraphQLObjectType<any, ResolverContext>({
  name: "ArtworksCollectionsBatchUpdateFailure",
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
  name: "ArtworksCollectionsBatchUpdateResponseOrError",
  types: [SuccessType, ErrorType],
})

interface InputProps {
  artworkIDs: string[]
  addToCollectionIDs: string[]
  removeFromCollectionIDs: string[]
}

export const artworksCollectionsBatchUpdateMutation = mutationWithClientMutationId<
  InputProps,
  any,
  ResolverContext
>({
  name: "ArtworksCollectionsBatchUpdate",
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
    if (!context.artworksCollectionsBatchUpdateLoader) {
      throw new Error("You need to be signed in to perform this action")
    }

    try {
      const response = await context.artworksCollectionsBatchUpdateLoader({
        artwork_ids: args.artworkIDs,
        add_to: args.addToCollectionIDs,
        remove_from: args.removeFromCollectionIDs,
      })

      const artworkID = args.artworkIDs[0]

      return {
        ...response,
        artworkID,
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
