/* eslint-disable promise/always-return */
import { runQuery } from "schema/v1/test/utils"
import { sampleOrder } from "test/fixtures/results/sample_order"
import exchangeOrderJSON from "test/fixtures/exchange/buy_order.json"
import { mockxchange } from "test/fixtures/exchange/mockxchange"
import gql from "lib/gql"
import { OrderSellerFields } from "./order_fields"

let context

describe("Confirm Pickup Mutation", () => {
  beforeEach(() => {
    const resolvers = {
      Mutation: {
        confirmPickup: () => ({
          orderOrError: { order: exchangeOrderJSON },
        }),
      },
    }

    context = mockxchange(resolvers)
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

    return runQuery(mutation, context).then((data) => {
      expect(data!.ecommerceConfirmPickup.orderOrError.order).toEqual(
        sampleOrder()
      )
    })
  })
})
