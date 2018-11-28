/* eslint-disable promise/always-return */
import { runQuery } from "test/utils"
import { mockxchange } from "test/fixtures/exchange/mockxchange"
import { sampleOrder } from "test/fixtures/results/sample_order"
import exchangeOrderJSON from "test/fixtures/exchange/buy_order.json"
import { OrderSellerFields } from "./order_fields"
import gql from "lib/gql"

let rootValue

describe("Reject Order Mutation", () => {
  beforeEach(() => {
    const resolvers = {
      Mutation: {
        rejectOrder: () => ({
          orderOrError: { order: exchangeOrderJSON },
        }),
      },
    }
    rootValue = mockxchange(resolvers)
  })
  it("rejects order and return it", () => {
    const mutation = gql`
      mutation {
        rejectOrder(input: { orderId: "111" }) {
          orderOrError {
            ... on OrderWithMutationSuccess {
              order {
                ${OrderSellerFields}
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

    return runQuery(mutation, rootValue).then(data => {
      expect(data!.rejectOrder.orderOrError.order).toEqual(sampleOrder())
    })
  })
})
