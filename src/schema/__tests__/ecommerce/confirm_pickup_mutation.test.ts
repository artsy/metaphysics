/* eslint-disable promise/always-return */
import { runQuery } from "test/utils"
import sampleOrder from "test/fixtures/results/sample_order"
import exchangeOrderJSON from "test/fixtures/exchange/order.json"
import { mockxchange } from "test/fixtures/exchange/mockxchange"
import gql from "lib/gql"
import { OrderSellerFields } from "./order_fields"

let rootValue

describe("Confirm Pickup Mutation", () => {
  beforeEach(() => {
    const resolvers = {
      Mutation: {
        confirmPickup: () => ({
          orderOrError: { order: exchangeOrderJSON },
        }),
      },
    }

    rootValue = mockxchange(resolvers)
  })
  it("confirms pickup on an order and returns order", () => {
    const mutation = gql`
      mutation {
        ecommerceConfirmPickup(input: { orderId: "111" }) {
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
      expect(data!.ecommerceConfirmPickup.orderOrError.order).toEqual(
        sampleOrder(true, false)
      )
    })
  })
})
