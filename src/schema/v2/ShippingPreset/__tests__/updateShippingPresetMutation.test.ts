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
          domesticType: ARTSY_SHIPPING
          internationalType: NOT_SUPPORTED
        }
      ) {
        shippingPresetOrError {
          __typename
          ... on UpdateShippingPresetSuccess {
            shippingPreset {
              internalID
              name
              domesticShippingFeeCents
              domesticType
              internationalType
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
          domestic_type: "artsy_shipping",
          international_shipping_fee_cents: 5000,
          international_type: "not_supported",
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
            domesticType: "ARTSY_SHIPPING",
            internationalType: "NOT_SUPPORTED",
          },
        },
      },
    })
  })

  it("updates a shipping preset with priceCurrency", async () => {
    const mutation = gql`
      mutation {
        updateShippingPreset(
          input: {
            id: "preset123"
            priceCurrency: "EUR"
            domesticShippingFeeCents: 2000
            domesticType: FREE_SHIPPING
          }
        ) {
          shippingPresetOrError {
            __typename
            ... on UpdateShippingPresetSuccess {
              shippingPreset {
                internalID
                priceCurrency
                domesticShippingFeeCents
                domesticType
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

    const context = {
      updateShippingPresetLoader: jest.fn((_id, args) => {
        expect(args.price_currency).toBe("EUR")
        expect(args.domestic_type).toBe("free_shipping")
        return Promise.resolve({
          id: "preset123",
          partner_id: "partner123",
          name: "Updated Shipping",
          domestic_shipping_fee_cents: 2000,
          domestic_type: "free_shipping",
          international_shipping_fee_cents: 5000,
          pickup_available: true,
          artsy_shipping_domestic: false,
          artsy_shipping_international: false,
          price_currency: "EUR",
        })
      }),
    }

    const updatedPreset = await runAuthenticatedQuery(mutation, context)

    expect(updatedPreset).toEqual({
      updateShippingPreset: {
        shippingPresetOrError: {
          __typename: "UpdateShippingPresetSuccess",
          shippingPreset: {
            internalID: "preset123",
            priceCurrency: "EUR",
            domesticShippingFeeCents: 2000,
            domesticType: "FREE_SHIPPING",
          },
        },
      },
    })
  })
})
