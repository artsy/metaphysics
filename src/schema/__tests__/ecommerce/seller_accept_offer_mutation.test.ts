import { runQuery } from "test/utils"
import { sampleOrder } from "test/fixtures/results/sample_order"
import gql from "lib/gql"
import { mockxchange } from "test/fixtures/exchange/mockxchange"
import { OrderSellerFields } from "./order_fields"
import exchangeOrderJSON from "test/fixtures/exchange/order.json"

let rootValue

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

  it("approves the order of the offer", () => {
    const resolvers = {
      Mutation: {
        sellerAcceptOffer: () => ({
          orderOrError: { order: exchangeOrderJSON },
        }),
      },
    }

    rootValue = mockxchange(resolvers)

    return runQuery(mutation, rootValue).then(data => {
      expect(data!.ecommerceSellerAcceptOffer.orderOrError.order).toEqual(
        sampleOrder()
      )
    })
  })

  it("returns an error if there is one", () => {
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

    rootValue = mockxchange(resolvers)

    return runQuery(mutation, rootValue).then(data => {
      expect(data!.ecommerceSellerAcceptOffer.orderOrError.error).toEqual({
        type: "application_error",
        code: "404",
        data: null,
      })
    })
  })
})
