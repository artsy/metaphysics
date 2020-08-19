import { GraphQLString, GraphQLList, GraphQLNonNull } from "graphql"
import { mutationWithClientMutationId } from "graphql-relay"
import { ArtworkType } from "schema/v2/artwork/index"
import { ResolverContext } from "types/graphql"

export const myCollectionUpdateArtworkMutation = mutationWithClientMutationId<
  any,
  any,
  ResolverContext
>({
  name: "MyCollectionUpdateArtwork",
  description: "Update an artwork in my collection",
  inputFields: {
    artworkId: {
      type: new GraphQLNonNull(GraphQLString),
    },
    artistIds: {
      type: new GraphQLList(GraphQLString),
    },
    dimensions: {
      type: GraphQLString,
    },
    medium: {
      type: GraphQLString,
    },
  },
  outputFields: {
    artwork: {
      type: ArtworkType,
      resolve: ({ artworkId }, _, { myCollectionArtworkLoader }) => {
        if (myCollectionArtworkLoader) {
          return myCollectionArtworkLoader(artworkId)
        }
      },
    },
  },
  mutateAndGetPayload: (
    { artworkId, artistIds, dimensions, medium },
    { myCollectionUpdateArtworkLoader }
  ) => {
    if (!myCollectionUpdateArtworkLoader) {
      return new Error("You need to be signed in to perform this action")
    }

    return myCollectionUpdateArtworkLoader(artworkId, {
      artist_ids: artistIds,
      dimensions,
      medium,
    }).then(() => {
      return {
        artworkId,
      }
    })
  },
})
