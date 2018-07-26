/* eslint-disable promise/always-return */
import { runQuery } from "test/utils"
import sampleOrder from "test/fixtures/results/sample_order"
import exchangeOrderJSON from "test/fixtures/exchange/order.json"
import { mockxchange } from "test/fixtures/exchange/mockxchange"

let rootValue

describe("Approve Order Mutation", () => {
  beforeEach(() => {
    const resolvers = {
      Mutation: {
        setShipping: () => ({
          order: exchangeOrderJSON,
          errors: [],
        }),
      },
    }

    rootValue = mockxchange(resolvers)
  })
  it("sets order's payment information", () => {
    const mutation = `
      mutation {
        setOrderShipping(input: {
            orderId: "111",
            fulfillmentType: SHIP,
            shippingAddressLine1: "Vanak",
            shippingAddressLine2: "P 80",
            shippingCity: "Tehran",
            shippingRegion: "TH",
            shippingCountry: "Iran",
            shippingPostalCode: "09821",
          }) {
            result {
              order {
                id
                code
                currencyCode
                state
                fulfillmentType
                shippingAddressLine1
                shippingAddressLine2
                shippingCity
                shippingCountry
                shippingPostalCode
                shippingRegion
                itemsTotalCents
                shippingTotalCents
                taxTotalCents
                commissionFeeCents
                transactionFeeCents
                buyerTotalCents
                sellerTotalCents
                itemsTotal
                shippingTotal
                taxTotal
                commissionFee
                transactionFee
                buyerTotal
                sellerTotal
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
      expect(data.setOrderShipping.result.order).toEqual(sampleOrder)
    })
  })
})
