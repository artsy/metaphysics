/* eslint-disable promise/always-return */
import { runQuery } from "test/utils"
import { mockxchange } from "test/fixtures/exchange/mockxchange"
import sampleOrder from "test/fixtures/results/sample_order"
import exchangeOrderJSON from "test/fixtures/exchange/order.json"
import { OrderSellerFields } from "./order_fields"
import gql from "lib/gql"

let rootValue

describe("Reject Order Mutation", () => {
  beforeEach(() => {
    const resolvers = {
      Mutation: {
        rejectOrder: () => ({
          order: exchangeOrderJSON,
          errors: [],
        }),
      },
    }
    rootValue = mockxchange(resolvers)
  })
  it("rejects order and return it", () => {
    const mutation = gql`
      mutation {
        rejectOrder(input: { orderId: "111" }) {
          result {
            order {
              ${OrderSellerFields}
            }
            errors
          }
        }
      }
    `

    return runQuery(mutation, rootValue).then(data => {
      expect(data.rejectOrder.result.order).toEqual(sampleOrder(true, false))
    })
  })
})
