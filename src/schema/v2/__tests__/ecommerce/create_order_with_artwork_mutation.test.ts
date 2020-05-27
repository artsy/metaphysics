/* eslint-disable promise/always-return */
import { runQuery } from "schema/v2/test/utils"
import { mockxchange } from "test/fixtures/exchange/mockxchange"
import { sampleOrder } from "test/fixtures/results/sample_order"
import exchangeOrderJSON from "test/fixtures/exchange/buy_order.json"
import gql from "lib/gql"
import { OrderBuyerFields } from "./order_fields"

let context

describe("Create Buy Order Mutation", () => {
  beforeEach(() => {
    const resolvers = {
      Mutation: {
        createOrderWithArtwork: () => ({
          orderOrError: { order: exchangeOrderJSON },
        }),
      },
    }

    context = mockxchange(resolvers)
  })

  it("creates order and returns it", () => {
    const mutation = gql`
      mutation {
        ecommerceCreateOrderWithArtwork(
          input: { artworkId: "111", editionSetId: "232", quantity: 1 }
        ) {
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

    return runQuery(mutation, context).then((data) => {
      expect(data!.ecommerceCreateOrderWithArtwork.orderOrError.order).toEqual(
        sampleOrder()
      )
    })
  })
})
