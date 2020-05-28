/* eslint-disable promise/always-return */
import { runQuery } from "schema/v1/test/utils"
import { mockxchange } from "test/fixtures/exchange/mockxchange"
import { sampleOrder } from "test/fixtures/results/sample_order"
import exchangeOrderJSON from "test/fixtures/exchange/buy_order.json"
import { OrderSellerFields } from "./order_fields"
import gql from "lib/gql"

let context

describe("Reject Order Mutation", () => {
  beforeEach(() => {
    const resolvers = {
      Mutation: {
        rejectOrder: () => ({
          orderOrError: { order: exchangeOrderJSON },
        }),
      },
    }
    context = mockxchange(resolvers)
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

    return runQuery(mutation, context).then((data) => {
      expect(data!.rejectOrder.orderOrError.order).toEqual(sampleOrder())
    })
  })
})
