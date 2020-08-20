import gql from "lib/gql"
import { GraphQLSchema } from "graphql"

export const causalityStitchingEnvironment = ({
  causalitySchema,
  localSchema,
}: {
  causalitySchema: GraphQLSchema & { transforms: any }
  localSchema: GraphQLSchema
}) => {
  return {
    extensionSchema: gql`
      extend type Me {
        auctionsLotStandings: AuctionsLotStandingConnection
      }

      extend type AuctionsLotStanding {
        saleArtwork: SaleArtwork
      }
    `,

    resolvers: {
      AuctionsLotStanding: {
        saleArtwork: {
          fragment: gql`
            fragment AuctionsLotStandingSaleArtwork on AuctionsLotStanding {
              lot {
                internalID
              }
            }
          `,
          resolve: (parent, _args, context, info) => {
            return info.mergeInfo.delegateToSchema({
              schema: localSchema,
              operation: "query",
              fieldName: "saleArtwork",
              args: { id: parent.lot.internalID },
              transforms: causalitySchema.transforms,
              context,
              info,
            })
          },
        },
      },
      Me: {
        auctionsLotStandings: {
          // The required query to get access to the object, e.g. we have to
          // request `id` on a Me in order to access the user's lot standings
          fragment: gql`
            fragment MeLotStandings on Me {
              internalID
            }
          `,
          // The function to handle getting the lot standings correctly, we
          // use the root query `auctionsLotStandings` to grab the data from the local
          // metaphysics schema
          resolve: (parent, _args, context, info) => {
            console.log("Fetching lot standings for " + parent.internalID)
            return info.mergeInfo.delegateToSchema({
              schema: causalitySchema,
              operation: "query",
              fieldName: "_unused_auctionsLotStandings",
              args: {
                userId: parent.internalID,
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
