import { runQuery } from "schema/v1/test/utils"
import { sampleOrder } from "test/fixtures/results/sample_order"
import gql from "lib/gql"
import { mockxchange } from "test/fixtures/exchange/mockxchange"
import { OrderSellerFields } from "./order_fields"
import exchangeOrderJSON from "test/fixtures/exchange/offer_order.json"

let context

describe("SellerCounterOffer Mutation", () => {
  const mutation = gql`
    mutation {
      ecommerceSellerCounterOffer(input: {offerId: "111", offerPrice: { amount: 1, currencyCode: "USD" }} ) {
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

    context = mockxchange(resolvers)

    return runQuery(mutation, context).then((data) => {
      expect(data!.ecommerceSellerCounterOffer.orderOrError.order).toEqual(
        sampleOrder({ mode: "OFFER", includeOfferFields: true })
      )
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

    context = mockxchange(resolvers)

    return runQuery(mutation, context).then((data) => {
      expect(data!.ecommerceSellerCounterOffer.orderOrError.error).toEqual({
        type: "application_error",
        code: "404",
        data: null,
      })
    })
  })
})
