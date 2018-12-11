import { runQuery } from "test/utils"
import { sampleOrder } from "test/fixtures/results/sample_order"
import gql from "lib/gql"
import { mockxchange } from "test/fixtures/exchange/mockxchange"
import { OrderSellerFields } from "./order_fields"
import exchangeOrderJSON from "test/fixtures/exchange/buy_order.json"

let rootValue

describe("SellerCounterOffer Mutation", () => {
  const mutation = gql`
    mutation {
      ecommerceSellerCounterOffer(input: { offerId: "111", offerPrice: { amount: 1, currencyCode: "USD" } }) {
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

  it("counters buyers offer", () => {
    const resolvers = {
      Mutation: {
        sellerCounterOffer: () => ({
          orderOrError: { order: exchangeOrderJSON },
        }),
      },
    }

    rootValue = mockxchange(resolvers)

    return runQuery(mutation, rootValue).then(data => {
      expect(
        data!.ecommerceSellerCounterOffer.orderOrError.order
      ).toEqual(sampleOrder())
    })
  })

  it("returns an error if there is one", () => {
    const resolvers = {
      Mutation: {
        sellerCounterOffer: () => ({
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
      expect(
        data!.ecommerceSellerCounterOffer.orderOrError.error
      ).toEqual({
        type: "application_error",
        code: "404",
        data: null,
      })
    })
  })
})
