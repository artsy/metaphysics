/* eslint-disable promise/always-return */
import { runQuery } from "schema/v1/test/utils"
import { mockxchange } from "test/fixtures/exchange/mockxchange"
import { sampleOrder } from "test/fixtures/results/sample_order"
import exchangeOrderJSON from "test/fixtures/exchange/buy_order.json"
import gql from "lib/gql"
import { OrderBuyerFields } from "./order_fields"

let context

describe("Create Offer Order Mutation", () => {
  const mutation = gql`
    mutation {
      ecommerceCreateOfferOrderWithArtwork(
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

  it("creates offer order and returns it", () => {
    const resolvers = {
      Mutation: {
        createOfferOrderWithArtwork: () => ({
          orderOrError: { order: exchangeOrderJSON },
        }),
      },
    }

    context = mockxchange(resolvers)

    return runQuery(mutation, context).then((data) => {
      expect(
        data!.ecommerceCreateOfferOrderWithArtwork.orderOrError.order
      ).toEqual(sampleOrder())
    })
  })

  it("returns an error if there is one", () => {
    const resolvers = {
      Mutation: {
        createOfferOrderWithArtwork: () => ({
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
      expect(
        data!.ecommerceCreateOfferOrderWithArtwork.orderOrError.error
      ).toEqual({ type: "application_error", code: "404", data: null })
    })
  })
})
