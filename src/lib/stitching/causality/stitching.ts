import gql from "lib/gql"

export const causalityStitchingEnvironment = ({
  localSchema,
  causalitySchema,
}) => {
  return {
    extensionSchema: gql`
      extend type Me {
        auctionsLotStandings: AuctionsLotStandingConnectionConnection
      }
    `,

    resolvers: {
      Me: {
        auctionsLotStandings: {
          // The required query to get access to the object, e.g. we have to
          // request `artist_id` on a ConsignmentSubmission in order to access the artist
          // at all
          fragment: gql`
            fragment MeLotStandings on Me {
              id
            }
          `,
          // The function to handle getting the Artist data correctly, we
          // use the root query `artist(id: id)` to grab the data from the local
          // metaphysics schema
          resolve: (parent, _args, context, info) => {
            const userId = parent.id
            console.log(userId)
            return info.mergeInfo.delegateToSchema({
              schema: causalitySchema,
              operation: "query",
              fieldName: "auctionsLotStandings",
              args: {
                userId,
              },
              context,
              info,
              // transforms: (causalitySchema as any).transforms,
            })
          },
        },
      },
    },
  }
}
