import gql from "lib/gql"
import { Response as FetchResponse } from "node-fetch"
import { formatMoney } from "accounting"
import { GraphQLError, GraphQLSchema } from "graphql"
import {
  moneyMajorResolver,
  symbolFromCurrencyCode,
} from "schema/v2/fields/money"
import { connectionFromArray } from "graphql-relay"
import { convertConnectionArgsToGravityArgs } from "lib/helpers"

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
      # A unified auction lot with data from our auctions bidding engine.
      type Lot {
        internalID: String
        # The current auction state of the lot.
        lot: AuctionsLotState!
        # The associated SaleArtwork
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
          resolve: async (_parent, args, context, _info) => {
            const { saleArtworksAllLoader, causalityLoader } = context
            // fetch sale artworks from gravity
            const { first = 25, ...rest } = args

            const connectionOptions = {
              include_watched_artworks: true,
              total_count: true,
              first,
              ...rest,
            }
            const params = convertConnectionArgsToGravityArgs(connectionOptions)
            delete params.page

            const { body, headers } = await saleArtworksAllLoader(params)
            const watchedSaleArtworks: any[] = body
            const totalCount = parseInt(headers["x-total-count"] || "0", 10)

            // fetch lot states from causality
            // Because this is not a stitched request,
            // We must explicitly query for fields here
            // and perform money transformations below to approximate
            // the lotState interface.
            const lotStatesResponse = await causalityLoader({
              query: gql`
                query WatchedLotsQuery($ids: [ID!]!) {
                  lots(ids: $ids) {
                    id
                    internalID
                    saleId
                    bidCount
                    reserveStatus
                    sellingPriceCents
                    onlineAskingPriceCents
                    floorSellingPriceCents
                    onlineSellingToBidder {
                      __typename
                      ... on ArtsyBidder {
                        id
                        paddleNumber
                        userId
                      }
                    }
                    floorWinningBidder {
                      __typename
                      ... on ArtsyBidder {
                        id
                        paddleNumber
                        userId
                      }
                    }
                    soldStatus
                  }
                }
              `,
              variables: {
                ids: watchedSaleArtworks.map((sa) => sa._id),
              },
            }).then((res: FetchResponse) => res.json())

            const { data, errors: causalityErrors } = lotStatesResponse

            // If the causality request failed for some reason, throw its errors.
            if (causalityErrors) {
              const errors = causalityErrors.reduce((acc, ce) => {
                return acc + " " + ce["message"]
              }, "From causality: ")
              throw new GraphQLError(errors)
            }

            const lots: any[] = data.lots

            // zip up watchedSaleArtworks with associated lot states
            const nodes = watchedSaleArtworks.reduce((acc, saleArtwork) => {
              const lot = lots.find((l) => l.internalID === saleArtwork._id)
              if (!lot) {
                console.warn(
                  `lot state for ${saleArtwork._id} not found - skipping`
                )
                return acc
              }

              const {
                onlineAskingPriceCents,
                sellingPriceCents,
                floorSellingPriceCents,
              } = lot

              return [
                ...acc,
                {
                  saleArtwork,
                  lot: {
                    ...lot,
                    onlineAskingPrice: resolveLotCentsFieldToMoney(
                      onlineAskingPriceCents
                    ),
                    sellingPrice: resolveLotCentsFieldToMoney(
                      sellingPriceCents
                    ),
                    floorSellingPrice: resolveLotCentsFieldToMoney(
                      floorSellingPriceCents
                    ),
                  },
                },
              ]
            }, [])

            return {
              totalCount,
              ...connectionFromArray(nodes, connectionOptions),
            }
          },
        },
      },
    },
  }
}
