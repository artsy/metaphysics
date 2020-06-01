import { runQuery } from "schema/v1/test/utils"
import { sampleOrder } from "test/fixtures/results/sample_order"
import gql from "lib/gql"
import { mockxchange } from "test/fixtures/exchange/mockxchange"
import exchangeOrderJSON from "test/fixtures/exchange/buy_order.json"
import { OrderBuyerFields } from "./order_fields"

let context

describe("SubmitPendingOffer Mutation", () => {
  const mutation = gql`
    mutation {
      ecommerceSubmitPendingOffer(input: { offerId: "111" }) {
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

  it("submits offer", () => {
    const resolvers = {
      Mutation: {
        submitPendingOffer: () => ({
          orderOrError: { order: exchangeOrderJSON },
        }),
      },
    }

    context = mockxchange(resolvers)

    return runQuery(mutation, context).then((data) => {
      expect(data!.ecommerceSubmitPendingOffer.orderOrError.order).toEqual(
        sampleOrder()
      )
    })
  })

  it("returns an error if there is one", () => {
    const resolvers = {
      Mutation: {
        submitPendingOffer: () => ({
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
      expect(data!.ecommerceSubmitPendingOffer.orderOrError.error).toEqual({
        type: "application_error",
        code: "404",
        data: null,
      })
    })
  })
})
