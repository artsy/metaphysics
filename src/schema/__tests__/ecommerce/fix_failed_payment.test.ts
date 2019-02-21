import { runQuery } from "test/utils"
import { sampleOrder } from "test/fixtures/results/sample_order"
import gql from "lib/gql"
import { mockxchange } from "test/fixtures/exchange/mockxchange"
import { OrderSellerFields } from "./order_fields"
import exchangeOrderJSON from "test/fixtures/exchange/buy_order.json"

let rootValue

describe("FixFailedPayment Mutation", () => {
  const mutation = gql`
    mutation {
      ecommerceFixFailedPayment(input: { offerId: "111", creditCardId: "card-id" }) {
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

  it("does not fail", () => {
    const resolvers = {
      Mutation: {
        fixFailedPayment: () => ({
          orderOrError: { order: exchangeOrderJSON },
        }),
      },
    }

    rootValue = mockxchange(resolvers)

    return runQuery(mutation, rootValue).then(data => {
      expect(data!.ecommerceFixFailedPayment.orderOrError.order).toEqual(
        sampleOrder()
      )
    })
  })

  it("returns an error if there is one", () => {
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

    rootValue = mockxchange(resolvers)

    return runQuery(mutation, rootValue).then(data => {
      expect(data!.ecommerceFixFailedPayment.orderOrError.error).toEqual({
        type: "application_error",
        code: "404",
        data: null,
      })
    })
  })
})
