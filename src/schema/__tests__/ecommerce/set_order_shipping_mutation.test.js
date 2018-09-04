/* eslint-disable promise/always-return */
import { runQuery } from "test/utils"
import sampleOrder from "test/fixtures/results/sample_order"
import exchangeOrderJSON from "test/fixtures/exchange/order.json"
import { mockxchange } from "test/fixtures/exchange/mockxchange"
import { OrderBuyerFields } from "./order_fields"
import gql from "lib/gql"

let rootValue

describe("Approve Order Mutation", () => {
  beforeEach(() => {
    const resolvers = {
      Mutation: {
        setShipping: () => ({
          orderOrError: { order: exchangeOrderJSON },
        }),
      },
    }

    rootValue = mockxchange(resolvers)
  })
  it("sets order's shipping information", () => {
    const mutation = gql`
      mutation {
        setOrderShipping(
          input: {
            orderId: "111"
            fulfillmentType: SHIP
            phoneNumber: "090302821"
            shipping: {
              name: "Dr Collector"
              addressLine1: "Vanak"
              addressLine2: "P 80"
              city: "Tehran"
              region: "TH"
              country: "Iran"
              postalCode: "09821"
            }
          }
        ) {
          orderOrError {
            ... on OrderWithMutationSuccess {
              order {
                ${OrderBuyerFields}
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
      expect(data.setOrderShipping.orderOrError.order).toEqual(
        sampleOrder(true, false)
      )
    })
  })
})
