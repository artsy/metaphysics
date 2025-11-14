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
        international_shipping_fee_cents: 5000,
        pickup_available: true,
        artsy_shipping_domestic: false,
        artsy_shipping_international: false,
      },
      {
        id: "shipping-preset-2",
        name: "Express Shipping",
        partner_id: "partner-id",
        domestic_shipping_fee_cents: 2500,
        international_shipping_fee_cents: 7500,
        pickup_available: false,
        artsy_shipping_domestic: true,
        artsy_shipping_international: true,
      },
      {
        id: "shipping-preset-3",
        name: "Local Pickup Only",
        partner_id: "partner-id",
        domestic_shipping_fee_cents: null,
        international_shipping_fee_cents: null,
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
                internationalShippingFeeCents
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
                internationalShippingFeeCents: 5000,
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
                internationalShippingFeeCents: 7500,
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
                internationalShippingFeeCents: null,
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
})
