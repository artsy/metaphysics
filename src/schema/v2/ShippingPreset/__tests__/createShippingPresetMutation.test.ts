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
          internationalShippingFeeCents: 5000
          pickupAvailable: true
          artsyShippingDomestic: false
          artsyShippingInternational: false
        }
      ) {
        shippingPresetOrError {
          __typename
          ... on CreateShippingPresetSuccess {
            shippingPreset {
              internalID
              name
              domesticShippingFeeCents
              internationalShippingFeeCents
              pickupAvailable
              artsyShippingDomestic
              artsyShippingInternational
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
          international_shipping_fee_cents: 5000,
          pickup_available: true,
          artsy_shipping_domestic: false,
          artsy_shipping_international: false,
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
            internationalShippingFeeCents: 5000,
            pickupAvailable: true,
            artsyShippingDomestic: false,
            artsyShippingInternational: false,
          },
        },
      },
    })
  })

  it("returns an error when not authenticated", async () => {
    const context = {}

    const result = await runAuthenticatedQuery(mutation, context)

    expect(result.createShippingPreset.shippingPresetOrError.__typename).toBe(
      "CreateShippingPresetFailure"
    )
  })
})
