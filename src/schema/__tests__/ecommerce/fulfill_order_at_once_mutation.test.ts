/* eslint-disable promise/always-return */
import { runQuery } from "test/utils"
import { mockxchange } from "test/fixtures/exchange/mockxchange"
import sampleOrder from "test/fixtures/results/sample_order"
import exchangeOrderJSON from "test/fixtures/exchange/order.json"
import gql from "lib/gql"
import { OrderSellerFields } from "./order_fields"

let rootValue

describe("Fulfill Order at Once Mutation", () => {
  beforeEach(() => {
    const resolvers = {
      Mutation: {
        fulfillAtOnce: () => ({
          orderOrError: { order: exchangeOrderJSON },
        }),
      },
    }

    rootValue = mockxchange(resolvers)
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

    return runQuery(mutation, rootValue).then(data => {
      expect(data!.fulfillOrderAtOnce.orderOrError.order).toEqual(
        sampleOrder(true, true)
      )
    })
  })
})
