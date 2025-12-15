import { runQuery } from "schema/v2/test/utils"
import gql from "lib/gql"

describe("partner.shippingPresetsConnection", () => {
  let response
  let context

  beforeEach(() => {
    response = [
      {
        id: "shipping-preset-1",
        name: "Standard Shipping",
        partner_id: "partner-id",
        domestic_shipping_fee_cents: 1000,
        domestic_type: "flat_fee",
        international_shipping_fee_cents: 5000,
        international_type: "flat_fee",
        pickup_available: true,
        artsy_shipping_domestic: false,
        artsy_shipping_international: false,
      },
      {
        id: "shipping-preset-2",
        name: "Express Shipping",
        partner_id: "partner-id",
        domestic_shipping_fee_cents: 2500,
        domestic_type: "artsy_shipping",
        international_shipping_fee_cents: 7500,
        international_type: "artsy_shipping",
        pickup_available: false,
        artsy_shipping_domestic: true,
        artsy_shipping_international: true,
      },
      {
        id: "shipping-preset-3",
        name: "Local Pickup Only",
        partner_id: "partner-id",
        domestic_shipping_fee_cents: null,
        domestic_type: null,
        international_shipping_fee_cents: null,
        international_type: "not_supported",
        pickup_available: true,
        artsy_shipping_domestic: false,
        artsy_shipping_international: false,
      },
    ]

    const shippingPresetsLoader = () => {
      return Promise.resolve({
        body: response,
        headers: {
          "x-total-count": response.length,
        },
      })
    }

    context = {
      partnerLoader: () => {
        return Promise.resolve({
          _id: "partner-id",
        })
      },
      shippingPresetsLoader,
    }
  })

  it("returns shipping presets", async () => {
    const query = gql`
      {
        partner(id: "partner-id") {
          shippingPresetsConnection(first: 5) {
            edges {
              node {
                internalID
                name
                partnerID
                domesticShippingFeeCents
                domesticType
                internationalShippingFeeCents
                internationalType
                pickupAvailable
                artsyShippingDomestic
                artsyShippingInternational
              }
            }
          }
        }
      }
    `

    const data = await runQuery(query, context)
    expect(data).toEqual({
      partner: {
        shippingPresetsConnection: {
          edges: [
            {
              node: {
                internalID: "shipping-preset-1",
                name: "Standard Shipping",
                partnerID: "partner-id",
                domesticShippingFeeCents: 1000,
                domesticType: "FLAT_FEE",
                internationalShippingFeeCents: 5000,
                internationalType: "FLAT_FEE",
                pickupAvailable: true,
                artsyShippingDomestic: false,
                artsyShippingInternational: false,
              },
            },
            {
              node: {
                internalID: "shipping-preset-2",
                name: "Express Shipping",
                partnerID: "partner-id",
                domesticShippingFeeCents: 2500,
                domesticType: "ARTSY_SHIPPING",
                internationalShippingFeeCents: 7500,
                internationalType: "ARTSY_SHIPPING",
                pickupAvailable: false,
                artsyShippingDomestic: true,
                artsyShippingInternational: true,
              },
            },
            {
              node: {
                internalID: "shipping-preset-3",
                name: "Local Pickup Only",
                partnerID: "partner-id",
                domesticShippingFeeCents: null,
                domesticType: null,
                internationalShippingFeeCents: null,
                internationalType: "NOT_SUPPORTED",
                pickupAvailable: true,
                artsyShippingDomestic: false,
                artsyShippingInternational: false,
              },
            },
          ],
        },
      },
    })
  })

  it("returns hasNextPage=true when first is below total", async () => {
    const query = gql`
      {
        partner(id: "partner-id") {
          shippingPresetsConnection(first: 1) {
            pageInfo {
              hasNextPage
            }
          }
        }
      }
    `

    const data = await runQuery(query, context)

    expect(data).toEqual({
      partner: {
        shippingPresetsConnection: {
          pageInfo: {
            hasNextPage: true,
          },
        },
      },
    })
  })

  it("returns hasNextPage=false when first is above total", async () => {
    const query = gql`
      {
        partner(id: "partner-id") {
          shippingPresetsConnection(first: 3) {
            pageInfo {
              hasNextPage
            }
          }
        }
      }
    `

    const data = await runQuery(query, context)

    expect(data).toEqual({
      partner: {
        shippingPresetsConnection: {
          pageInfo: {
            hasNextPage: false,
          },
        },
      },
    })
  })

  it("loads the total count", async () => {
    const query = gql`
      {
        partner(id: "partner-id") {
          shippingPresetsConnection(first: 3) {
            totalCount
          }
        }
      }
    `

    const data = await runQuery(query, context)

    expect(data).toEqual({
      partner: {
        shippingPresetsConnection: {
          totalCount: 3,
        },
      },
    })
  })

  it("returns null when shippingPresetsLoader is not available", async () => {
    const contextWithoutLoader = {
      partnerLoader: () => {
        return Promise.resolve({
          _id: "partner-id",
        })
      },
    }

    const query = gql`
      {
        partner(id: "partner-id") {
          shippingPresetsConnection(first: 5) {
            edges {
              node {
                name
              }
            }
          }
        }
      }
    `

    const data = await runQuery(query, contextWithoutLoader)

    expect(data).toEqual({
      partner: {
        shippingPresetsConnection: null,
      },
    })
  })

  describe("filtering by priceCurrency", () => {
    beforeEach(() => {
      response = [
        {
          id: "preset-usd",
          name: "USD Shipping",
          partner_id: "partner-id",
          price_currency: "USD",
          domestic_shipping_fee_cents: 1000,
          international_shipping_fee_cents: 5000,
        },
        {
          id: "preset-eur",
          name: "EUR Shipping",
          partner_id: "partner-id",
          price_currency: "EUR",
          domestic_shipping_fee_cents: 1200,
          international_shipping_fee_cents: 6000,
        },
        {
          id: "preset-gbp",
          name: "GBP Shipping",
          partner_id: "partner-id",
          price_currency: "GBP",
          domestic_shipping_fee_cents: 1100,
          international_shipping_fee_cents: 5500,
        },
        {
          id: "preset-nil",
          name: "No Currency Shipping",
          partner_id: "partner-id",
          price_currency: null,
          domestic_shipping_fee_cents: 1000,
          international_shipping_fee_cents: 5000,
        },
      ]
    })

    it("filters by USD and includes presets with nil currency", async () => {
      const shippingPresetsLoader = jest.fn(() => {
        const filteredResponse = response.filter(
          (preset) =>
            preset.price_currency === "USD" || preset.price_currency === null
        )
        return Promise.resolve({
          body: filteredResponse,
          headers: {
            "x-total-count": filteredResponse.length,
          },
        })
      })

      const testContext = {
        partnerLoader: () => {
          return Promise.resolve({
            _id: "partner-id",
          })
        },
        shippingPresetsLoader,
      }

      const query = gql`
        {
          partner(id: "partner-id") {
            shippingPresetsConnection(first: 10, priceCurrency: "USD") {
              edges {
                node {
                  internalID
                  name
                  priceCurrency
                }
              }
            }
          }
        }
      `

      const data = await runQuery(query, testContext)

      expect(shippingPresetsLoader).toHaveBeenCalledWith(
        expect.objectContaining({
          price_currency: "USD",
        })
      )

      expect(data).toEqual({
        partner: {
          shippingPresetsConnection: {
            edges: [
              {
                node: {
                  internalID: "preset-usd",
                  name: "USD Shipping",
                  priceCurrency: "USD",
                },
              },
              {
                node: {
                  internalID: "preset-nil",
                  name: "No Currency Shipping",
                  priceCurrency: null,
                },
              },
            ],
          },
        },
      })
    })

    it("filters by EUR and includes presets with nil currency", async () => {
      const shippingPresetsLoader = jest.fn(() => {
        const filteredResponse = response.filter(
          (preset) =>
            preset.price_currency === "EUR" || preset.price_currency === null
        )
        return Promise.resolve({
          body: filteredResponse,
          headers: {
            "x-total-count": filteredResponse.length,
          },
        })
      })

      const testContext = {
        partnerLoader: () => {
          return Promise.resolve({
            _id: "partner-id",
          })
        },
        shippingPresetsLoader,
      }

      const query = gql`
        {
          partner(id: "partner-id") {
            shippingPresetsConnection(first: 10, priceCurrency: "EUR") {
              edges {
                node {
                  internalID
                  name
                  priceCurrency
                }
              }
            }
          }
        }
      `

      const data = await runQuery(query, testContext)

      expect(shippingPresetsLoader).toHaveBeenCalledWith(
        expect.objectContaining({
          price_currency: "EUR",
        })
      )

      expect(data).toEqual({
        partner: {
          shippingPresetsConnection: {
            edges: [
              {
                node: {
                  internalID: "preset-eur",
                  name: "EUR Shipping",
                  priceCurrency: "EUR",
                },
              },
              {
                node: {
                  internalID: "preset-nil",
                  name: "No Currency Shipping",
                  priceCurrency: null,
                },
              },
            ],
          },
        },
      })
    })

    it("filters by GBP and includes presets with nil currency", async () => {
      const shippingPresetsLoader = jest.fn(() => {
        const filteredResponse = response.filter(
          (preset) =>
            preset.price_currency === "GBP" || preset.price_currency === null
        )
        return Promise.resolve({
          body: filteredResponse,
          headers: {
            "x-total-count": filteredResponse.length,
          },
        })
      })

      const testContext = {
        partnerLoader: () => {
          return Promise.resolve({
            _id: "partner-id",
          })
        },
        shippingPresetsLoader,
      }

      const query = gql`
        {
          partner(id: "partner-id") {
            shippingPresetsConnection(first: 10, priceCurrency: "GBP") {
              edges {
                node {
                  internalID
                  name
                  priceCurrency
                }
              }
            }
          }
        }
      `

      const data = await runQuery(query, testContext)

      expect(shippingPresetsLoader).toHaveBeenCalledWith(
        expect.objectContaining({
          price_currency: "GBP",
        })
      )

      expect(data).toEqual({
        partner: {
          shippingPresetsConnection: {
            edges: [
              {
                node: {
                  internalID: "preset-gbp",
                  name: "GBP Shipping",
                  priceCurrency: "GBP",
                },
              },
              {
                node: {
                  internalID: "preset-nil",
                  name: "No Currency Shipping",
                  priceCurrency: null,
                },
              },
            ],
          },
        },
      })
    })

    it("returns all presets when priceCurrency is not provided", async () => {
      const shippingPresetsLoader = jest.fn(() => {
        return Promise.resolve({
          body: response,
          headers: {
            "x-total-count": response.length,
          },
        })
      })

      const testContext = {
        partnerLoader: () => {
          return Promise.resolve({
            _id: "partner-id",
          })
        },
        shippingPresetsLoader,
      }

      const query = gql`
        {
          partner(id: "partner-id") {
            shippingPresetsConnection(first: 10) {
              totalCount
              edges {
                node {
                  internalID
                }
              }
            }
          }
        }
      `

      const data = await runQuery(query, testContext)

      expect(shippingPresetsLoader).toHaveBeenCalledWith(
        expect.objectContaining({
          price_currency: undefined,
        })
      )

      expect(data.partner.shippingPresetsConnection.totalCount).toBe(4)
      expect(data.partner.shippingPresetsConnection.edges).toHaveLength(4)
    })
  })
})
