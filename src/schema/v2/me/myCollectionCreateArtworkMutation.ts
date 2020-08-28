import { GraphQLString, GraphQLList } from "graphql"
import { mutationWithClientMutationId } from "graphql-relay"
import { ArtworkType } from "schema/v2/artwork/index"
import { ResolverContext } from "types/graphql"
import { GraphQLNonNull } from "graphql"

export const myCollectionCreateArtworkMutation = mutationWithClientMutationId<
  any,
  any,
  ResolverContext
>({
  name: "MyCollectionCreateArtwork",
  description: "Create an artwork in my collection",
  inputFields: {
    artistIds: {
      type: new GraphQLNonNull(new GraphQLList(GraphQLString)),
    },
    dimensions: {
      type: new GraphQLNonNull(GraphQLString),
    },
    medium: {
      type: new GraphQLNonNull(GraphQLString),
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
      resolve: ({ id }, _, { myCollectionArtworkLoader }) => {
        if (myCollectionArtworkLoader) {
          return myCollectionArtworkLoader(id)
        }
      },
    },
  },
  mutateAndGetPayload: (
    { artistIds, dimensions, medium, title, year },
    { myCollectionCreateArtworkLoader }
  ) => {
    if (!myCollectionCreateArtworkLoader) {
      return new Error("You need to be signed in to perform this action")
    }

    return myCollectionCreateArtworkLoader({
      artist_ids: artistIds,
      dimensions,
      medium,
      title,
      year,
    }).then(({ id }) => {
      return {
        id,
      }
    })
  },
})
