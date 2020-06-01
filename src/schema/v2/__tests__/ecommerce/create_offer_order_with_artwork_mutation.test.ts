/* eslint-disable promise/always-return */
import { runQuery } from "schema/v2/test/utils"
import { mockxchange } from "test/fixtures/exchange/mockxchange"
import { sampleOrder } from "test/fixtures/results/sample_order"
import exchangeOrderJSON from "test/fixtures/exchange/buy_order.json"
import gql from "lib/gql"
import { OrderBuyerFields } from "./order_fields"

let context

// FIXME: Failing due to Commerce prefixes not being found on schema
describe.skip("Create Offer Order Mutation", () => {
  const mutation = gql`
    mutation {
      commerceCreateOfferOrderWithArtwork(
        input: { artworkId: "111", editionSetId: "232", quantity: 1 }
      ) {
        orderOrError {
          ... on CommerceOrderWithMutationSuccess {
            order {
              ${OrderBuyerFields}
            }
          }
          ... on CommerceOrderWithMutationFailure {
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
        commerceCreateOfferOrderWithArtwork: () => ({
          orderOrError: { order: exchangeOrderJSON },
        }),
      },
    }

    context = mockxchange(resolvers)

    return runQuery(mutation, context).then((data) => {
      expect(
        data!.commerceCreateOfferOrderWithArtwork.orderOrError.order
      ).toEqual(sampleOrder())
    })
  })

  it("returns an error if there is one", () => {
    const resolvers = {
      Mutation: {
        commerceCreateOfferOrderWithArtwork: () => ({
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
        data!.commerceCreateOfferOrderWithArtwork.orderOrError.error
      ).toEqual({ type: "application_error", code: "404", data: null })
    })
  })
})
