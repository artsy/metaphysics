/* eslint-disable promise/always-return */
import { runQuery } from "schema/v2/test/utils"
import { mockxchange } from "test/fixtures/exchange/mockxchange"
import { sampleOrder } from "test/fixtures/results/sample_order"
import exchangeOrderJSON from "test/fixtures/exchange/buy_order.json"
import gql from "lib/gql"
import { OrderSellerFields } from "./order_fields"

let context

describe("Fulfill Order at Once Mutation", () => {
  beforeEach(() => {
    const resolvers = {
      Mutation: {
        fulfillAtOnce: () => ({
          orderOrError: { order: exchangeOrderJSON },
        }),
      },
    }

    context = mockxchange(resolvers)
  })
  it("fulfills the order and return it", () => {
    const mutation = gql`
      mutation {
        fulfillOrderAtOnce(
          input: {
            orderId: "111"
            fulfillment: {
              courier: "fedEx"
              trackingId: "track1"
              estimatedDelivery: "2018-05-18"
            }
          }
        )
        { orderOrError {
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
      expect(data!.fulfillOrderAtOnce.orderOrError.order).toEqual(
        sampleOrder({ fulfillments: true })
      )
    })
  })
})
