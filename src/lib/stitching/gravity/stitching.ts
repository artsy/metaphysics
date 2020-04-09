import gql from "lib/gql"
import { GraphQLSchema } from "graphql"

export const gravityStitchingEnvironment = (localSchema: GraphQLSchema) => {
  return {
    // The SDL used to declare how to stitch an object
    extensionSchema: gql`
      extend type ViewingRoomArtwork {
        artwork: Artwork
      }
    `,

    resolvers: {
      ViewingRoomArtwork: {
        artwork: {
          fragment: `
            ... on ViewingRoomArtwork {
              artworkID
            }
          `,
          resolve: (parent, _args, context, info) => {
            return info.mergeInfo.delegateToSchema({
              schema: localSchema,
              operation: "query",
              fieldName: "artwork",

              args: {
                id: parent.artworkID,
              },
              context,
              info,
            })
          },
        },
      },
    },
  }
}
