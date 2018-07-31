/* eslint-disable promise/always-return */

import { runQuery } from "test/utils"
import { mockxchange } from "test/fixtures/exchange/mockxchange"
import sampleOrder from "test/fixtures/results/sample_order"
import exchangeOrdersJSON from "test/fixtures/exchange/orders.json"

let rootValue

describe("Order type", () => {
  beforeEach(() => {
    const resolvers = { Query: { orders: () => exchangeOrdersJSON } }
    rootValue = mockxchange(resolvers)
  })
  it("fetches order by partner id", () => {
    const query = `
      {
        orders(partnerId: "581b45e4cd530e658b000124") {
          edges {
            node {
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
          }
        }
      }
    `

    return runQuery(query, rootValue).then(data => {
      expect(data.orders.edges[0].node).toEqual(sampleOrder(true, false))
    })
  })
})
