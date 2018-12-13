import gql from "lib/gql"
import { OrderBuyerFields } from "./order_fields"
import exchangeOrderJSON from "test/fixtures/exchange/buy_order.json"
import { mockxchange } from "test/fixtures/exchange/mockxchange"
import { runQuery } from "test/utils"
import { sampleOrder } from "test/fixtures/results/sample_order"

let rootValue

describe("BuyerRejectOffer Mutation", () => {
  const mutation = gql`
    mutation {
      ecommerceBuyerRejectOffer(input: {offerId: "111"}) {
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

  it("rejects the seller offer", () => {
    const resolvers = {
      Mutation: {
        buyerRejectOffer: () => ({
          orderOrError: { order: exchangeOrderJSON },
        }),
      },
    }

    rootValue = mockxchange(resolvers)

    return runQuery(mutation, rootValue).then(data => {
      expect(data!.ecommerceBuyerRejectOffer.orderOrError.order).toEqual(
        sampleOrder()
      )
    })
  })

  it("returns an error if there is one", () => {
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

    rootValue = mockxchange(resolvers)

    return runQuery(mutation, rootValue).then(data => {
      expect(data!.ecommerceBuyerRejectOffer.orderOrError.error).toEqual({
        type: "application_error",
        code: "404",
        data: null,
      })
    })
  })
})
