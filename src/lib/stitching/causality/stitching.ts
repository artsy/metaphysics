import gql from "lib/gql"
import { formatMoney } from "accounting"
import { GraphQLSchema } from "graphql"
import {
  moneyMajorResolver,
  symbolFromCurrencyCode,
} from "schema/v2/fields/money"

const resolveLotCentsFieldToMoney = (centsField) => {
  return async (parent, _args, context, _info) => {
    const { internalID, [centsField]: cents } = parent
    const { currency } = await context.saleArtworkRootLoader(internalID)
    const major = await moneyMajorResolver({ cents, currency }, {}, context)

    return {
      major,
      minor: cents,
      currencyCode: currency,
      display: formatMoney(major, symbolFromCurrencyCode(currency), 0),
    }
  }
}

export const causalityStitchingEnvironment = ({
  causalitySchema,
  localSchema,
}: {
  causalitySchema: GraphQLSchema & { transforms: any }
  localSchema: GraphQLSchema
}) => {
  return {
    extensionSchema: gql`
      type Lot {
        internalID: String
        lot: AuctionsLotState!
        saleArtwork: SaleArtwork
      }

      # A connection to a list of items.
      type LotConnection {
        # A list of edges.
        edges: [LotEdge]
        pageCursors: PageCursors!

        # Information to aid in pagination.
        pageInfo: PageInfo!
        totalCount: Int
      }

      # An edge in a connection.
      type LotEdge {
        # A cursor for use in pagination
        cursor: String!

        # The item at the end of the edge
        node: Lot
      }

      extend type Me {
        auctionsLotStandingConnection(
          first: Int
          last: Int
          after: String
          before: String
        ): AuctionsLotStandingConnection!

        watchedLotConnection(
          first: Int
          last: Int
          after: String
          before: String
        ): LotConnection!
      }

      extend type AuctionsLotStanding {
        saleArtwork: SaleArtwork
      }

      extend type AuctionsLotState {
        "current high bid recognized on the live auction floor"
        floorSellingPrice: Money
        "current high bid"
        sellingPrice: Money
        onlineAskingPrice: Money
      }
    `,

    resolvers: {
      Lot: {
        internalID: {
          resolve: ({ saleArtwork }) => saleArtwork._id,
        },
        saleArtwork: {
          resolve: ({ saleArtwork }) => saleArtwork,
        },
        lot: {
          resolve: ({ lot }) => {
            return lot
          },
        },
      },
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
        watchedLotConnection: {
          resolve: async (_parent, _args, { saleArtworksAllLoader }) => {
            const watchedSaleArtworksReq = await saleArtworksAllLoader({
              include_watched_artworks: true,
            })
            const watchedSaleArtworks = watchedSaleArtworksReq.body

            const nodes = watchedSaleArtworks.map((sa) => ({
              saleArtwork: sa,
              // TODO: fetch actual lot states
              lot: {
                id: "12346789",
                bidCount: 4,
                reserveStatus: "NoReserve",
                sellingPrice: {
                  display: "$1,600",
                },
                soldStatus: "ForSale",
                internalID: "5fec9c2caa6ad9000d757ae0",
              },
            }))

            return {
              totalCount: watchedSaleArtworks.length,
              edges: nodes.map((node) => ({ node })),
            }
          },
        },
      },
    },
  }
}
