import gql from "lib/gql"
import { OrderBuyerFields } from "./order_fields"
import exchangeOrderJSON from "test/fixtures/exchange/buy_order.json"
import { mockxchange } from "test/fixtures/exchange/mockxchange"
import { runQuery } from "schema/v2/test/utils"
import { sampleOrder } from "test/fixtures/results/sample_order"

let context

describe("BuyerRejectOffer Mutation", () => {
  const mutationWithRejectReason = gql`
    mutation {
      ecommerceBuyerRejectOffer(input: { offerId: "111", rejectReason: BUYER_REJECTED }) {
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

  const mutationWithoutRejectReason = gql`
    mutation {
      ecommerceBuyerRejectOffer(input: { offerId: "111" }) {
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

  it("rejects the seller offer with a reason", () => {
    const resolvers = {
      Mutation: {
        buyerRejectOffer: () => ({
          orderOrError: { order: exchangeOrderJSON },
        }),
      },
    }

    context = mockxchange(resolvers)

    return runQuery(mutationWithRejectReason, context).then((data) => {
      expect(data!.ecommerceBuyerRejectOffer.orderOrError.order).toEqual(
        sampleOrder()
      )
    })
  })

  it("rejects the seller offer without a reason", () => {
    const resolvers = {
      Mutation: {
        buyerRejectOffer: () => ({
          orderOrError: { order: exchangeOrderJSON },
        }),
      },
    }

    context = mockxchange(resolvers)

    return runQuery(mutationWithoutRejectReason, context).then((data) => {
      expect(data!.ecommerceBuyerRejectOffer.orderOrError.order).toEqual(
        sampleOrder()
      )
    })
  })

  it("returns an error if an error occurs", () => {
    const resolvers = {
      Mutation: {
        buyerRejectOffer: () => ({
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

    return runQuery(mutationWithoutRejectReason, context).then((data) => {
      expect(data!.ecommerceBuyerRejectOffer.orderOrError.error).toEqual({
        type: "application_error",
        code: "404",
        data: null,
      })
    })
  })
})
