/* eslint-disable promise/always-return */
import { runQuery } from "test/utils"
import { mockxchange } from "test/fixtures/exchange/mockxchange"
import sampleOrder from "test/fixtures/results/sample_order"
import exchangeOrderJSON from "test/fixtures/exchange/order.json"
import gql from "lib/gql"

let rootValue

describe("Create Order Mutation", () => {
  beforeEach(() => {
    const resolvers = {
      Mutation: {
        createOrderWithArtwork: () => ({
          orderOrError: { order: exchangeOrderJSON },
        }),
      },
      OrderOrFailureUnion: {
        __resolveType(obj, context, info) {
          if (obj.order) {
            return "OrderWithMutationSuccess"
          } else if (obj.error) {
            return "OrderWithMutationFailure"
          }
        },
      },
    }

    rootValue = mockxchange(resolvers)
  })

  it("creates order and returns it", () => {
    const mutation = gql`
      mutation {
        createOrderWithArtwork(
          input: { artworkId: "111", editionSetId: "232", quantity: 1 }
        ) {
          orderOrError {
            ... on OrderWithMutationSuccess {
              order {
                id
                buyerTotal
                buyerTotalCents
                code
                commissionFee
                commissionFeeCents
                createdAt
                currencyCode
                fulfillmentType
                itemsTotal
                itemsTotalCents
                sellerTotal
                sellerTotalCents
                shippingAddressLine1
                shippingAddressLine2
                shippingCity
                shippingCountry
                shippingName
                shippingPostalCode
                shippingRegion
                shippingTotal
                shippingTotalCents
                state
                stateExpiresAt
                stateUpdatedAt
                taxTotal
                taxTotalCents
                transactionFee
                transactionFeeCents
                updatedAt
                partner {
                  id
                  name
                }
                user {
                  id
                  email
                }
                lineItems {
                  edges {
                    node {
                      artwork {
                        id
                        title
                        inventoryId
                      }
                    }
                  }
                }
              }
            }
            ... on OrderWithMutationFailure {
              error {
                description
              }
            }
          }
        }
      }
    `

    return runQuery(mutation, rootValue).then(data => {
      expect(data.createOrderWithArtwork.orderOrError.order).toEqual(
        sampleOrder(true, false)
      )
    })
  })
})
