/* eslint-disable promise/always-return */
import { runQuery } from "test/utils"
import { mockxchange } from "test/fixtures/exchange/mockxchange"
import sampleOrder from "test/fixtures/results/sample_order"
import exchangeOrderJSON from "test/fixtures/exchange/order.json"
import gql from "lib/gql"
import { OrderBuyerFields } from "./order_fields"

let rootValue

describe("Create Offer Order Mutation", () => {
  beforeEach(() => {
    const resolvers = {
      Mutation: {
        createOfferOrderWithArtwork: () => ({
          orderOrError: exchangeOrderJSON,
        }),
      },
    }

    rootValue = mockxchange(resolvers)
  })

  it("creates offer order and returns it", () => {
    const mutation = gql`
      mutation {
        ecommerceCreateOfferOrderWithArtworkMutation(
          input: { artworkId: "111", editionSetId: "232", quantity: 1 }
        ) {
          orderOrError {
            ... on Order {
              ${OrderBuyerFields}
            }
            ... on EcommerceError {
              type
              errorCode: code
              data
            }
          }
        }
      }
    `

    return runQuery(mutation, rootValue).then(data => {
      expect(
        data!.ecommerceCreateOfferOrderWithArtworkMutation.orderOrError
      ).toEqual(sampleOrder(true, false))
    })
  })
})
