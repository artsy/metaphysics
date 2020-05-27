/* eslint-disable promise/always-return */
import { runQuery } from "schema/v2/test/utils"
import { mockxchange } from "test/fixtures/exchange/mockxchange"
import { sampleOrder } from "test/fixtures/results/sample_order"
import exchangeOrderJSON from "test/fixtures/exchange/buy_order.json"
import { OrderBuyerFields } from "./order_fields"
import gql from "lib/gql"

let context

describe("Submit Order Mutation", () => {
  beforeEach(() => {
    const resolvers = {
      Mutation: {
        submitOrder: () => ({
          orderOrError: {
            order: exchangeOrderJSON,
          },
        }),
      },
    }

    context = mockxchange(resolvers)
  })
  it("submits order and returns it", () => {
    const mutation = gql`
      mutation {
        submitOrder(input: { orderId: "111" }) {
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
      expect(data!.submitOrder.orderOrError.order).toEqual(sampleOrder())
    })
  })
})
