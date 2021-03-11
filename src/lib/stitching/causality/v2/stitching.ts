import gql from "lib/gql"
import { GraphQLSchema } from "graphql"
import { resolveLotCentsFieldToMoney } from "schema/v2/fields/money"

export const causalityStitchingEnvironment = ({
  causalitySchema,
  localSchema,
}: {
  causalitySchema: GraphQLSchema & { transforms: any }
  localSchema: GraphQLSchema
}) => {
  return {
    extensionSchema: gql`
      extend type AuctionsLotState {
        "current high bid recognized on the live auction floor"
        floorSellingPrice: Money
        "current high bid"
        sellingPrice: Money
        onlineAskingPrice: Money
      }

      extend type Lot {
        lot: AuctionsLotState
      }

      extend type Me {
        auctionsLotStandingConnection(
          first: Int
          last: Int
          after: String
          before: String
        ): AuctionsLotStandingConnection!
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
              lotState {
                internalID
              }
            }
          `,
          resolve: (parent, _args, context, info) => {
            return info.mergeInfo.delegateToSchema({
              schema: localSchema,
              operation: "query",
              fieldName: "saleArtwork",
              args: { id: parent.lotState.internalID },
              context,
              info,
            })
          },
        },
      },
      AuctionsLotState: {
        floorSellingPrice: {
          fragment: gql`
            ... on AuctionsLotState {
              internalID
              floorSellingPriceCents
            }
          `,
          resolve: resolveLotCentsFieldToMoney("floorSellingPriceCents"),
        },
        sellingPrice: {
          fragment: gql`
            ... on AuctionsLotState {
              internalID
              sellingPriceCents
            }
          `,
          resolve: resolveLotCentsFieldToMoney("sellingPriceCents"),
        },
        onlineAskingPrice: {
          fragment: gql`
            ... on AuctionsLotState {
              internalID
              onlineAskingPriceCents
            }
          `,
          resolve: resolveLotCentsFieldToMoney("onlineAskingPriceCents"),
        },
      },
      Lot: {
        lot: {
          fragment: gql`
            ... on Lot {
              saleArtwork {
                internalID
              }
            }
          `,

          resolve: (parent, _args, context, info) => {
            return info.mergeInfo.delegateToSchema({
              schema: causalitySchema,
              operation: "query",
              fieldName: "_unused_auctionsLot",
              args: { id: parent.saleArtwork.internalID },
              context,
              info,
            })
          },
        },
      },
      Me: {
        auctionsLotStandingConnection: {
          // The required query to get access to the object, e.g. we have to
          // request `id` on a Me in order to access the user's lot standings
          fragment: gql`
            fragment MeLotStandings on Me {
              internalID
            }
          `,
          // The function to handle getting the lot standings correctly, we
          // use the root query `_unused_auctionsLotStandingConnection` to grab
          // the data from the local causality schema. Other args from the field
          // (eg first, after, last, before) are forwarded automatically, so we only
          // need the userId.
          resolve: (parent, _args, context, info) => {
            return info.mergeInfo
              .delegateToSchema({
                schema: causalitySchema,
                operation: "query",
                fieldName: "_unused_auctionsLotStandingConnection",
                args: {
                  userId: parent.internalID,
                },
                context,
                info,
              })
              .then(async (lotStandingsConnection) => {
                const promisedSaleArtworks = lotStandingsConnection.edges.map(
                  ({ node: { lot } }) => {
                    return context
                      .saleArtworkRootLoader(lot.internalID)
                      .catch(() => null)
                  }
                )

                const availableSaleArtworks = (
                  await Promise.all(promisedSaleArtworks)
                ).filter((sa) => sa !== null)

                // FIXME: this depends on the presence of edge->node->lot->internalID in the query. see https://github.com/artsy/metaphysics/pull/2885#discussion_r543693841
                const availableEdges = lotStandingsConnection.edges.reduce(
                  (acc: any, edge: any) => {
                    const saleArtwork = availableSaleArtworks.find(
                      (sa: any) => sa._id === edge.node.lot.internalID
                    )
                    if (saleArtwork) {
                      return [
                        ...acc,
                        { ...edge, node: { ...edge.node, saleArtwork } },
                      ]
                    } else {
                      return acc
                    }
                  },
                  []
                )
                return { ...lotStandingsConnection, edges: availableEdges }
              })
          },
        },
      },
    },
  }
}
