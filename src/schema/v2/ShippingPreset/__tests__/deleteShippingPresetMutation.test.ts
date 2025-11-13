import gql from "lib/gql"
import { runAuthenticatedQuery } from "schema/v2/test/utils"

describe("DeleteShippingPresetMutation", () => {
  const mutation = gql`
    mutation {
      deleteShippingPreset(input: { id: "preset123" }) {
        shippingPresetOrError {
          __typename
          ... on DeleteShippingPresetSuccess {
            shippingPreset {
              internalID
              name
            }
          }
          ... on DeleteShippingPresetFailure {
            mutationError {
              message
            }
          }
        }
      }
    }
  `

  it("deletes a shipping preset", async () => {
    const context = {
      deleteShippingPresetLoader: () =>
        Promise.resolve({
          id: "preset123",
          partner_id: "partner123",
          name: "Standard Shipping",
          domestic_shipping_fee_cents: 1000,
          international_shipping_fee_cents: 5000,
          pickup_available: true,
          artsy_shipping_domestic: false,
          artsy_shipping_international: false,
        }),
    }

    const deletedPreset = await runAuthenticatedQuery(mutation, context)

    expect(deletedPreset).toEqual({
      deleteShippingPreset: {
        shippingPresetOrError: {
          __typename: "DeleteShippingPresetSuccess",
          shippingPreset: {
            internalID: "preset123",
            name: "Standard Shipping",
          },
        },
      },
    })
  })

  it("returns an error when not authenticated", async () => {
    const context = {}

    const result = await runAuthenticatedQuery(mutation, context)

    expect(result.deleteShippingPreset.shippingPresetOrError.__typename).toBe(
      "DeleteShippingPresetFailure"
    )
  })
})
