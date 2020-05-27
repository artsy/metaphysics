/* eslint-disable promise/always-return */
import { runQuery } from "schema/v1/test/utils"
import { mockxchange } from "test/fixtures/exchange/mockxchange"
import { sampleOrder } from "test/fixtures/results/sample_order"
import exchangeOrderJSON from "test/fixtures/exchange/offer_order.json"
import gql from "lib/gql"
import { OrderBuyerFields } from "./order_fields"
let context

describe("AddInitialOfferToOrder Mutation", () => {
  const mutation = gql`
    mutation {
      ecommerceAddInitialOfferToOrder(
        input: { orderId: "111", offerPrice: { amount: 1, currencyCode: "USD" }, note: "C sharp" }
      ) {
        orderOrError {
          ... on OrderWithMutationSuccess {
            order{
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
  it("creates offer order and returns it", () => {
    const resolvers = {
      Mutation: {
        addInitialOfferToOrder: () => ({
          orderOrError: { order: exchangeOrderJSON },
        }),
      },
    }
    context = mockxchange(resolvers)
    return runQuery(mutation, context).then((data) => {
      expect(data!.ecommerceAddInitialOfferToOrder.orderOrError.order).toEqual(
        sampleOrder({ mode: "OFFER", includeOfferFields: true })
      )
    })
  })

  it("returns an error if there is one", () => {
    const resolvers = {
      Mutation: {
        addInitialOfferToOrder: () => ({
          orderOrError: { error: { type: "application_error", code: "404" } },
        }),
      },
    }
    context = mockxchange(resolvers)
    return runQuery(mutation, context).then((data) => {
      expect(data!.ecommerceAddInitialOfferToOrder.orderOrError.error).toEqual({
        type: "application_error",
        code: "404",
        data: null,
      })
    })
  })
})
