import gql from "lib/gql"
import { runAuthenticatedQuery } from "schema/v2/test/utils"

describe("UpdateShippingPresetMutation", () => {
  const mutation = gql`
    mutation {
      updateShippingPreset(
        input: {
          id: "preset123"
          name: "Updated Shipping"
          domesticShippingFeeCents: 1500
        }
      ) {
        shippingPresetOrError {
          __typename
          ... on UpdateShippingPresetSuccess {
            shippingPreset {
              internalID
              name
              domesticShippingFeeCents
            }
          }
          ... on UpdateShippingPresetFailure {
            mutationError {
              message
            }
          }
        }
      }
    }
  `

  it("updates a shipping preset", async () => {
    const context = {
      updateShippingPresetLoader: () =>
        Promise.resolve({
          id: "preset123",
          partner_id: "partner123",
          name: "Updated Shipping",
          domestic_shipping_fee_cents: 1500,
          international_shipping_fee_cents: 5000,
          pickup_available: true,
          artsy_shipping_domestic: false,
          artsy_shipping_international: false,
        }),
    }

    const updatedPreset = await runAuthenticatedQuery(mutation, context)

    expect(updatedPreset).toEqual({
      updateShippingPreset: {
        shippingPresetOrError: {
          __typename: "UpdateShippingPresetSuccess",
          shippingPreset: {
            internalID: "preset123",
            name: "Updated Shipping",
            domesticShippingFeeCents: 1500,
          },
        },
      },
    })
  })

  it("returns an error when not authenticated", async () => {
    const context = {}

    const result = await runAuthenticatedQuery(mutation, context)

    expect(result.updateShippingPreset.shippingPresetOrError.__typename).toBe(
      "UpdateShippingPresetFailure"
    )
  })
})
