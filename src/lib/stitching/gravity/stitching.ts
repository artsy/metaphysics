import gql from "lib/gql"
import { GraphQLSchema } from "graphql"

export const gravityStitchingEnvironment = (
  localSchema: GraphQLSchema,
  gravitySchema: GraphQLSchema & { transforms: any }
) => {
  return {
    // The SDL used to declare how to stitch an object
    extensionSchema: gql`
      extend type Me {
        secondFactors(kinds: [SecondFactorKind]): [SecondFactor]
      }

      extend type ViewingRoomArtwork {
        artwork: Artwork
      }
    `,

    resolvers: {
      Me: {
        secondFactors: {
          resolve: (_parent, args, context, info) => {
            return info.mergeInfo.delegateToSchema({
              schema: gravitySchema,
              operation: "query",
              fieldName: "_unused_gravity_secondFactors",
              args: args,
              context,
              info,
            })
          },
        },
      },
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
