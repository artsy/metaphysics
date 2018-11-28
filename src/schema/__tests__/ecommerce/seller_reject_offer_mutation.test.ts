import { runQuery } from "test/utils"
import { sampleOrder } from "test/fixtures/results/sample_order"
import gql from "lib/gql"
import { mockxchange } from "test/fixtures/exchange/mockxchange"
import { OrderSellerFields } from "./order_fields"
import exchangeOrderJSON from "test/fixtures/exchange/buy_order.json"

let rootValue

describe("SellerRejectOffer Mutation", () => {
  const mutation = gql`
    mutation {
      ecommerceSellerRejectOffer(input: { offerId: "111", rejectReason: SELLER_REJECTED_OTHER }) {
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

  it("rejects the order of the offer", () => {
    const resolvers = {
      Mutation: {
        sellerRejectOffer: () => ({
          orderOrError: { order: exchangeOrderJSON },
        }),
      },
    }

    rootValue = mockxchange(resolvers)

    return runQuery(mutation, rootValue).then(data => {
      expect(data!.ecommerceSellerRejectOffer.orderOrError.order).toEqual(
        sampleOrder()
      )
    })
  })

  it("returns an error if there is one", () => {
    const resolvers = {
      Mutation: {
        sellerRejectOffer: () => ({
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
      expect(data!.ecommerceSellerRejectOffer.orderOrError.error).toEqual({
        type: "application_error",
        code: "404",
        data: null,
      })
    })
  })
})
