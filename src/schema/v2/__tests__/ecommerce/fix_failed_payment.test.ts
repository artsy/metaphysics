import { runQuery } from "schema/v2/test/utils"
import { sampleOrder } from "test/fixtures/results/sample_order"
import gql from "lib/gql"
import { mockxchange } from "test/fixtures/exchange/mockxchange"
import { OrderBuyerFields } from "./order_fields"
import exchangeOrderJSON from "test/fixtures/exchange/buy_order.json"

let context

describe("FixFailedPayment Mutation", () => {
  const mutation = gql`
    mutation {
      ecommerceFixFailedPayment(input: { offerId: "111", orderId: "1234", creditCardId: "card-id" }) {
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

  it("does not fail", async () => {
    const resolvers = {
      Mutation: {
        fixFailedPayment: () => ({
          orderOrError: { order: exchangeOrderJSON },
        }),
      },
    }

    context = mockxchange(resolvers)

    const data = await runQuery(mutation, context)

    expect(data!.ecommerceFixFailedPayment.orderOrError.order).toEqual(
      sampleOrder({ includeCreditCard: true })
    )
  })

  it("returns an error if there is one", async () => {
    const resolvers = {
      Mutation: {
        fixFailedPayment: () => ({
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

    expect(data!.ecommerceFixFailedPayment.orderOrError.error).toEqual({
      type: "application_error",
      code: "404",
      data: null,
    })
  })
})
