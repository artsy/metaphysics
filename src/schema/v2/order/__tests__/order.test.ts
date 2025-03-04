/* eslint-disable promise/always-return */
import gql from "lib/gql"
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
            order(id: "111") {
              id
              buyerPhoneNumber
              fulfillmentOptions {
                type
                amount
                selected
              }
              lineItems {
                edges {
                  node {
                    artworkId
                    artwork {
                      title
                    }
                  }
                }
              }
            }
          }
        }
      `

      context = {
        meOrderLoader: jest.fn().mockResolvedValue(orderJson),
        artworkLoader: jest.fn().mockResolvedValue(artwork),
        authenticatedArtworkVersionLoader: jest
          .fn()
          .mockResolvedValue(artworkVersion),
      }

      const { order: result } = await runAuthenticatedQuery(query, context)

      expect(result).toEqual({
        id: "111",
        buyerPhoneNumber: "1234567890",
        fulfillmentOptions: [
          { type: "pickup", amount: "$0.00" },
          { type: "domestic_flat", amount: "$100.00", selected: true },
          { type: "international_flat", amount: "$200" },
        ],
        lineItems: {
          edges: [
            {
              node: {
                artworkId: "222",
                artwork: {
                  title: "Artwork Title",
                },
              },
            },
          ],
        },
      })
    })
  })
})

const baseOrderJson = {
  id: "b7fde9ba-56ea-460a-95c9-7252da386d96",
  buyer_phone_number: null,
  buyer_phone_number_country_code: null,
  buyer_total_cents: null,
  code: "307375600",
  currency_code: "USD",
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
      id: "e159101a-5dba-44f8-a3f6-741d1df963ed",
      artwork_id: "artwork-id-0",
      artwork_version_id: "artwork-version-id-0",
      edition_set_id: null,
      list_price_cents: 10000,
      quantity: 1,
      shipping_total_cents: null,
    },
  ],
  available_shipping_countries: ["US", "JP"],
  pickup_available: true,
  fulfillment_options: [
    { type: "pickup", amount_minor: 0 },
    { type: "domestic_flat", amount_minor: 10000, selected: true },
    { type: "international_flat", amount_minor: 20000 },
  ],
}

const baseArtwork = {
  id: "artwork-id-0",
  title: "Artwork Title",
}
