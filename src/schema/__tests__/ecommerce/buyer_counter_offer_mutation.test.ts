import { runQuery } from "test/utils"
import { sampleOrder } from "test/fixtures/results/sample_order"
import gql from "lib/gql"
import { mockxchange } from "test/fixtures/exchange/mockxchange"
import exchangeOrderJSON from "test/fixtures/exchange/offer_order.json"
import { OrderBuyerFields } from "./order_fields"

let rootValue

describe("BuyerCounterOffer Mutation", () => {
  const mutation = gql`
    mutation {
      ecommerceBuyerCounterOffer(input: { offerId: "111", offerPrice: { amount: 1, currencyCode: "USD" } }) {
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

  it("counters sellers offer", () => {
    const resolvers = {
      Mutation: {
        buyerCounterOffer: () => ({
          orderOrError: { order: exchangeOrderJSON },
        }),
      },
    }

    rootValue = mockxchange(resolvers)

    return runQuery(mutation, rootValue).then(data => {
      expect(data!.ecommerceBuyerCounterOffer.orderOrError.order).toEqual(
        sampleOrder({ mode: "OFFER", includeOfferFields: true })
      )
    })
  })

  it("returns an error if there is one", () => {
    const resolvers = {
      Mutation: {
        buyerCounterOffer: () => ({
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
      expect(data!.ecommerceBuyerCounterOffer.orderOrError.error).toEqual({
        type: "application_error",
        code: "404",
        data: null,
      })
    })
  })
})
