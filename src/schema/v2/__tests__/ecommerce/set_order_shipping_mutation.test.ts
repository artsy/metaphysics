/* eslint-disable promise/always-return */
import { runQuery } from "schema/v2/test/utils"
import { sampleOrder } from "test/fixtures/results/sample_order"
import exchangeOrderJSON from "test/fixtures/exchange/buy_order.json"
import { mockxchange } from "test/fixtures/exchange/mockxchange"
import { OrderBuyerFields } from "./order_fields"
import gql from "lib/gql"

let context

describe("Approve Order Mutation", () => {
  beforeEach(() => {
    const resolvers = {
      Mutation: {
        setShipping: () => ({
          orderOrError: { order: exchangeOrderJSON },
        }),
      },
    }

    context = mockxchange(resolvers)
  })
  it("sets order's shipping information", () => {
    const mutation = gql`
      mutation {
        setOrderShipping(
          input: {
            orderId: "111"
            fulfillmentType: SHIP
            shipping: {
              name: "Dr Collector"
              addressLine1: "Vanak"
              addressLine2: "P 80"
              city: "Tehran"
              region: "TH"
              country: "Iran"
              postalCode: "09821"
              phoneNumber: "090302821"
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
                type
                code
                data
              }
            }
          }
        }
      }
    `

    return runQuery(mutation, context).then((data) => {
      expect(data!.setOrderShipping.orderOrError.order).toEqual(sampleOrder())
    })
  })
})
