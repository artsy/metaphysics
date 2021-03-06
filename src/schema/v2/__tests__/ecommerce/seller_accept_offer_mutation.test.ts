import { runQuery } from "schema/v2/test/utils"
import { sampleOrder } from "test/fixtures/results/sample_order"
import gql from "lib/gql"
import { mockxchange } from "test/fixtures/exchange/mockxchange"
import { OrderSellerFields } from "./order_fields"
import exchangeOrderJSON from "test/fixtures/exchange/buy_order.json"

let context

describe("SellerAcceptOffer Mutation", () => {
  const mutation = gql`
    mutation {
      ecommerceSellerAcceptOffer(input: { offerId: "111" }) {
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

  it("approves the order of the offer", async () => {
    const resolvers = {
      Mutation: {
        sellerAcceptOffer: () => ({
          orderOrError: { order: exchangeOrderJSON },
        }),
      },
    }

    context = mockxchange(resolvers)

    const data = await runQuery(mutation, context)

    expect(data!.ecommerceSellerAcceptOffer.orderOrError.order).toEqual(
      sampleOrder()
    )
  })

  it("returns an error if there is one", async () => {
    const resolvers = {
      Mutation: {
        sellerAcceptOffer: () => ({
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

    expect(data!.ecommerceSellerAcceptOffer.orderOrError.error).toEqual({
      type: "application_error",
      code: "404",
      data: null,
    })
  })
})
