import { connectionFromArray } from "graphql-relay"
import gql from "lib/gql"
import { GraphQLSchema } from "graphql"

export const gravityStitchingEnvironment = (
  gravitySchema: GraphQLSchema & { transforms: any }
) => {
  return {
    // The SDL used to declare how to stitch an object
    extensionSchema: gql`
      extend type Me {
        secondFactors(kinds: [SecondFactorKind]): [SecondFactor]
      }

      extend type ViewingRoom {
        artworks(
          first: Int
          last: Int
          after: String
          before: String
        ): ArtworkConnection
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
          fragment: gql`
            ... on ViewingRoom {
              artworksConnection {
                edges {
                  node {
                    artworkID
                  }
                }
              }
            }
          `,
          resolve: (parent, args, context, _info) => {
            let ids = []

            if (parent.artworksConnection) {
              ids = parent.artworksConnection.edges.map(
                edge => edge.node.artworkID
              )
            }

            if (ids.length === 0) {
              return connectionFromArray(ids, args)
            }

            return context.artworksLoader({ ids }).then(body => {
              return connectionFromArray(body, args)
            })
          },
        },
      },
    },
  }
}
