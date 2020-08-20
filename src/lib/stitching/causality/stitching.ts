import gql from "lib/gql"
import { GraphQLSchema } from "graphql"

export const causalityStitchingEnvironment = ({
  causalitySchema,
}: {
  causalitySchema: GraphQLSchema
  localSchema: GraphQLSchema
}) => {
  return {
    extensionSchema: gql`
      extend type Me {
        auctionsLotStandings: AuctionsLotStandingConnection
      }
    `,

    resolvers: {
      Me: {
        auctionsLotStandings: {
          // The required query to get access to the object, e.g. we have to
          // request `id` on a Me in order to access the user's lot standings
          fragment: gql`
            fragment MeLotStandings on Me {
              id
            }
          `,
          // The function to handle getting the lot standings correctly, we
          // use the root query `auctionsLotStandings` to grab the data from the local
          // metaphysics schema
          resolve: (parent, _args, context, info) => {
            return info.mergeInfo.delegateToSchema({
              schema: causalitySchema,
              operation: "query",
              fieldName: "_unused_auctionsLotStandings",
              args: {
                userId: parent.id,
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
