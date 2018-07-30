/* eslint-disable promise/always-return */

import { runQuery } from "test/utils"
import { mockxchange } from "test/fixtures/exchange/mockxchange"
import sampleOrder from "test/fixtures/results/sample_order"
import exchangeOrderJSON from "test/fixtures/exchange/order.json"

let rootValue

describe("Order type", () => {
  beforeEach(() => {
    const resolvers = { Query: { order: () => exchangeOrderJSON } }

    rootValue = mockxchange(resolvers)
  })
  it("fetches order by id", () => {
    const query = `
      {
        order(id: "52dd3c2e4b8480091700027f") {
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
                fulfillments {
                  edges {
                    node {
                      courier
                      trackingId
                      estimatedDelivery
                    }
                  }
                }
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
    `

    return runQuery(query, rootValue).then(data => {
      expect(data.order).toEqual(sampleOrder)
    })
  })
})
