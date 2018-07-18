/* eslint-disable promise/always-return */
import { runQuery } from "test/utils"
import { mockxchange } from "test/fixtures/exchange/mockxchange"
import sampleOrder from "test/fixtures/results/sample_order"
import exchangeOrderJSON from "test/fixtures/exchange/order.json"

let rootValue

describe("Create Order Mutation", () => {
  beforeEach(() => {
    const resolvers = {
      Mutation: {
        createOrder: () => ({
          order: exchangeOrderJSON,
          errors: [],
        }),
      },
    }

    rootValue = mockxchange(resolvers)
  })
  it("fetches order by id", () => {
    const mutation = `
      mutation {
        createOrder(input: {
            partnerId: "111",
            currencyCode: "usd",
            lineItems: [{
              artworkId: "111",
              quantity: 1
              priceCents: 300000
            }]
          }) {
            result {
              order {
                id
                code
                currencyCode
                state
                itemsTotalCents
                shippingTotalCents
                taxTotalCents
                commissionFeeCents
                transactionFeeCents
                buyerTotalCents
                sellerTotalCents
                updatedAt
                createdAt
                stateUpdatedAt
                stateExpiresAt
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
              errors
            }
          }
        }
    `

    return runQuery(mutation, rootValue).then(data => {
      expect(data.createOrder.result.order).toEqual(sampleOrder)
    })
  })
})
