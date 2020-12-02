import { runQuery } from "schema/v1/test/utils"
import { sampleOrder } from "test/fixtures/results/sample_order"
import gql from "lib/gql"
import { mockxchange } from "test/fixtures/exchange/mockxchange"
import { OrderSellerFields } from "./order_fields"
import exchangeOrderJSON from "test/fixtures/exchange/buy_order.json"

let context

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

  it("rejects the order of the offer", async () => {
    const resolvers = {
      Mutation: {
        sellerRejectOffer: () => ({
          orderOrError: { order: exchangeOrderJSON },
        }),
      },
    }

    context = mockxchange(resolvers)

    const data = await runQuery(mutation, context)

    expect(data!.ecommerceSellerRejectOffer.orderOrError.order).toEqual(
      sampleOrder()
    )
  })

  it("returns an error if there is one", async () => {
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

    context = mockxchange(resolvers)

    const data = await runQuery(mutation, context)

    expect(data!.ecommerceSellerRejectOffer.orderOrError.error).toEqual({
      type: "application_error",
      code: "404",
      data: null,
    })
  })
})
