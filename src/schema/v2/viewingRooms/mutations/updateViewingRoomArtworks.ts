import {
  GraphQLBoolean,
  GraphQLID,
  GraphQLInputObjectType,
  GraphQLInt,
  GraphQLList,
  GraphQLNonNull,
  GraphQLString,
} from "graphql"
import { mutationWithClientMutationId } from "graphql-relay"
import { ResolverContext } from "types/graphql"

const ViewingRoomArtworkInput = new GraphQLInputObjectType({
  name: "ViewingRoomArtworkInput",
  fields: {
    artworkID: {
      type: new GraphQLNonNull(GraphQLID),
    },
    position: {
      type: GraphQLInt,
    },
    delete: {
      type: GraphQLBoolean,
    },
    internalID: {
      type: GraphQLID,
    },
  },
})

export const updateViewingRoomArtworksMutation = mutationWithClientMutationId<
  any,
  any,
  ResolverContext
>({
  name: "UpdateViewingRoomArtworks",
  inputFields: {
    viewingRoomID: {
      type: new GraphQLNonNull(GraphQLString),
    },
    artworks: {
      type: new GraphQLNonNull(
        new GraphQLList(new GraphQLNonNull(ViewingRoomArtworkInput))
      ),
    },
  },
  outputFields: {
    artworkIDs: {
      type: new GraphQLNonNull(
        new GraphQLList(new GraphQLNonNull(GraphQLString))
      ),
      resolve: ({ artwork_ids }) => artwork_ids,
    },
  },
  mutateAndGetPayload: async (args, { updateViewingRoomArtworksLoader }) => {
    if (!updateViewingRoomArtworksLoader) {
      throw new Error("You need to be signed in to perform this action")
    }

    const artworks = args.artworks.map((artwork, _index) => {
      return {
        artwork_id: artwork.artworkID,
        delete: artwork.delete,
      }
    })

    // Can we keep the argument input the same and trigger use of
    // the request body (instead of query params) further down the stack?
    const response = await updateViewingRoomArtworksLoader(
      args.viewingRoomID,
      {},
      {
        body: {
          artworks: artworks,
        },
      }
    )

    return response
  },
})
