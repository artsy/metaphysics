import { GraphQLString, GraphQLList, GraphQLNonNull } from "graphql"
import {
  mutationWithClientMutationId,
  cursorForObjectInConnection,
} from "graphql-relay"
import { ArtworkType } from "schema/v2/artwork/index"
import { ResolverContext } from "types/graphql"
import { MyCollectionEdgeType } from "./myCollection"

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
    title: {
      type: GraphQLString,
    },
    year: {
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
    artworkEdge: {
      type: MyCollectionEdgeType,
      resolve: async ({ id }, _, { myCollectionArtworkLoader }) => {
        if (!myCollectionArtworkLoader) {
          return null
        }
        const artwork = await myCollectionArtworkLoader(id)
        const edge = {
          cursor: cursorForObjectInConnection([artwork], artwork),
          node: artwork,
        }
        return edge
      },
    },
  },
  mutateAndGetPayload: (
    { artworkId, artistIds, dimensions, medium, title, year },
    { myCollectionUpdateArtworkLoader }
  ) => {
    if (!myCollectionUpdateArtworkLoader) {
      return new Error("You need to be signed in to perform this action")
    }

    return myCollectionUpdateArtworkLoader(artworkId, {
      artist_ids: artistIds,
      dimensions,
      medium,
      title,
      year,
    }).then(() => {
      return {
        artworkId,
      }
    })
  },
})
