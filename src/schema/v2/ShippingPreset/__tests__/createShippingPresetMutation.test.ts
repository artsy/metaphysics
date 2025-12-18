import gql from "lib/gql"
import { runAuthenticatedQuery } from "schema/v2/test/utils"

describe("CreateShippingPresetMutation", () => {
  const mutation = gql`
    mutation {
      createShippingPreset(
        input: {
          partnerId: "partner123"
          name: "Standard Shipping"
          domesticShippingFeeCents: 1000
          domesticType: FLAT_FEE
          internationalShippingFeeCents: 5000
          internationalType: FLAT_FEE
          pickupAvailable: true
        }
      ) {
        shippingPresetOrError {
          __typename
          ... on CreateShippingPresetSuccess {
            shippingPreset {
              internalID
              name
              domesticShippingFeeCents
              domesticType
              internationalShippingFeeCents
              internationalType
              pickupAvailable
            }
          }
          ... on CreateShippingPresetFailure {
            mutationError {
              message
            }
          }
        }
      }
    }
  `

  it("creates a shipping preset", async () => {
    const context = {
      createShippingPresetLoader: () =>
        Promise.resolve({
          id: "preset123",
          partner_id: "partner123",
          name: "Standard Shipping",
          domestic_shipping_fee_cents: 1000,
          domestic_type: "flat_fee",
          international_shipping_fee_cents: 5000,
          international_type: "flat_fee",
          pickup_available: true,
        }),
    }

    const createdPreset = await runAuthenticatedQuery(mutation, context)

    expect(createdPreset).toEqual({
      createShippingPreset: {
        shippingPresetOrError: {
          __typename: "CreateShippingPresetSuccess",
          shippingPreset: {
            internalID: "preset123",
            name: "Standard Shipping",
            domesticShippingFeeCents: 1000,
            domesticType: "FLAT_FEE",
            internationalShippingFeeCents: 5000,
            internationalType: "FLAT_FEE",
            pickupAvailable: true,
          },
        },
      },
    })
  })
})
