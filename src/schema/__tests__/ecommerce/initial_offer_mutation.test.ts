/* eslint-disable promise/always-return */
import { runQuery } from "test/utils"
import { mockxchange } from "test/fixtures/exchange/mockxchange"
import { sampleOrder } from "test/fixtures/results/sample_order"
import exchangeOrderJSON from "test/fixtures/exchange/order.json"
import gql from "lib/gql"
import { OrderBuyerFields } from "./order_fields"
let rootValue
describe("InitialOffer Mutation", () => {
  const mutation = gql`
    mutation {
      ecommerceInitialOffer(
        input: { orderId: "111", offerPrice: { amount: 1, currencyCode: "USD" } }
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
        initialOffer: () => ({
          orderOrError: { order: exchangeOrderJSON },
        }),
      },
    }
    rootValue = mockxchange(resolvers)
    return runQuery(mutation, rootValue).then(data => {
      expect(data!.ecommerceInitialOffer.orderOrError.order).toEqual(
        sampleOrder()
      )
    })
  })
  it("returns an error if there is one", () => {
    const resolvers = {
      Mutation: {
        initialOffer: () => ({
          orderOrError: {
            error: {
              type: "application_error",
              code: "404",
            },
          },
        }),
      },
    }
    rootValue = mockxchange(resolvers)
    return runQuery(mutation, rootValue).then(data => {
      expect(data!.ecommerceInitialOffer.orderOrError.error).toEqual({
        type: "application_error",
        code: "404",
        data: null,
      })
    })
  })
})
