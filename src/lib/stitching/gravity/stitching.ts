import { connectionFromArray, connectionFromArraySlice } from "graphql-relay"
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

      extend type ViewingRoom {
        artworks: ArtworkConnection
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
      ViewingRoom: {
        artworks: {
          resolve: (parent, _args, context, _info) => {
            const ids = parent.artworksConnection.edges.map(
              edge => edge.node.artworkID
            )

            if (ids.length === 0) {
              return connectionFromArray(ids, _args)
            }

            return context.artworksLoader({ ids }).then(body => {
              return connectionFromArraySlice(body, _args, {
                arrayLength: body.length,
                sliceStart: 0,
              })
            })
          },
        },
      },
      ViewingRoomArtwork: {
        artwork: {
          fragment: gql`
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
