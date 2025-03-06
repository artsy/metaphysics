/* eslint-disable promise/always-return */
import gql from "lib/gql"
import { cond } from "lodash"
import { runAuthenticatedQuery } from "schema/v2/test/utils"

let context, orderJson, artwork, artworkVersion

describe("Me", () => {
  beforeEach(() => {
    orderJson = orderJson || { ...baseOrderJson }
    artwork = artwork || {
      ...baseArtwork,
      id: orderJson.line_items[0].artwork_id,
    }
    artworkVersion = artworkVersion || {
      ...baseArtwork,
      id: orderJson.line_items[0].artwork_version_id,
    }
  })
  describe("Order", () => {
    it("returns a buyer's order by id", async () => {
      const query = gql`
        query {
          me {
            order(id: "order-id") {
              internalID
              mode
              source
              code
              availableShippingCountries
              buyerPhoneNumber
              buyerTotal {
                display
              }
              fulfillmentOptions {
                type
                amount {
                  currencyCode
                  display
                }
                selected
              }
              itemsTotal {
                minor
                display
                currencyCode
              }
              lineItems {
                internalID
                currencyCode
                artwork {
                  title
                }
                artworkVersion {
                  internalID
                }
                listPrice {
                  display
                }
                quantity
              }
            }
          }
        }
      `

      orderJson.buyer_total_cents = 500000
      context = {
        meLoader: jest.fn().mockResolvedValue({ id: "me-id" }),
        meOrderLoader: jest.fn().mockResolvedValue(orderJson),
        artworkLoader: jest.fn().mockResolvedValue(artwork),
        authenticatedArtworkVersionLoader: jest
          .fn()
          .mockResolvedValue(artworkVersion),
      }

      const result = await runAuthenticatedQuery(query, context)

      expect(result.me.order).toEqual({
        internalID: "order-id",
        mode: "BUY",
        source: "ARTWORK_PAGE",
        code: "order-code",
        availableShippingCountries: ["US", "JP"],
        buyerPhoneNumber: null,
        buyerTotal: {
          display: "US$5,000",
        },
        itemsTotal: {
          currencyCode: "USD",
          display: "US$100",
          minor: 10000,
        },
        fulfillmentOptions: [
          {
            type: "PICKUP",
            amount: {
              display: "US$0",
              currencyCode: "USD",
            },
            selected: null,
          },
          {
            type: "DOMESTIC_FLAT",
            amount: {
              display: "US$100",
              currencyCode: "USD",
            },
            selected: true,
          },
        ],
        lineItems: [
          {
            internalID: "line-item-id-0",
            artwork: {
              title: "Artwork Title",
            },
            artworkVersion: {
              internalID: "artwork-version-id-0",
            },
            currencyCode: "USD",
            listPrice: {
              display: "US$100",
            },
            quantity: 1,
          },
        ],
      })
    })
  })
})

const baseOrderJson = {
  id: "order-id",
  buyer_phone_number: null,
  buyer_phone_number_country_code: null,
  buyer_total_cents: null,
  code: "order-code",
  currency_code: "USD",
  items_total_cents: 10000,
  shipping_total_cents: null,
  mode: "buy",
  source: "artwork_page",
  shipping_country: "US",
  shipping_postal_code: null,
  shipping_region: null,
  shipping_city: null,
  shipping_address_line1: null,
  shipping_address_line2: null,
  line_items: [
    {
      id: "line-item-id-0",
      artwork_id: "artwork-id-0",
      artwork_version_id: "artwork-version-id-0",
      edition_set_id: null,
      list_price_cents: 10000,
      quantity: 1,
      shipping_total_cents: null,
      currency_code: "USD",
    },
  ],
  available_shipping_countries: ["US", "JP"],
  pickup_available: true,
  fulfillment_options: [
    { type: "pickup", amount_minor: 0 },
    { type: "domestic_flat", amount_minor: 10000, selected: true },
  ],
}

const baseArtwork = {
  id: "artwork-id-0",
  title: "Artwork Title",
}
