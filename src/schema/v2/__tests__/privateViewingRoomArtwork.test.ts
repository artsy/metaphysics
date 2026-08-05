import gql from "lib/gql"
import { runQuery } from "schema/v2/test/utils"

describe("PrivateViewingRoomArtwork.price", () => {
  const query = gql`
    {
      privateViewingRoom(slug: "some-gallery-for-anna") {
        artworks {
          priceCents
          priceCurrency
          price {
            minor
            major
            currencyCode
            display
          }
        }
      }
    }
  `

  it("formats the pinned price as Money", async () => {
    const context = {
      privateViewingRoomLoader: jest.fn().mockResolvedValue({
        password_required: false,
        artworks: [
          {
            artwork_id: "artwork-1",
            price_cents: 500000,
            price_currency: "USD",
          },
        ],
      }),
    }

    const result = await runQuery(query, context)

    expect(result.privateViewingRoom.artworks[0]).toEqual({
      priceCents: 500000,
      priceCurrency: "USD",
      price: {
        minor: 500000,
        major: 5000,
        currencyCode: "USD",
        display: "US$5,000",
      },
    })
  })

  it("returns null price when there is no pinned price", async () => {
    const context = {
      privateViewingRoomLoader: jest.fn().mockResolvedValue({
        password_required: false,
        artworks: [{ artwork_id: "artwork-1" }],
      }),
    }

    const result = await runQuery(query, context)

    expect(result.privateViewingRoom.artworks[0].price).toBeNull()
  })

  it("returns null price when there's a pinned price but no currency", async () => {
    const context = {
      privateViewingRoomLoader: jest.fn().mockResolvedValue({
        password_required: false,
        artworks: [{ artwork_id: "artwork-1", price_cents: 500000 }],
      }),
    }

    const result = await runQuery(query, context)

    expect(result.privateViewingRoom.artworks[0].price).toBeNull()
  })

  it("uses the correct subunit factor for a zero-decimal currency (regression)", async () => {
    // JPY has subunit_to_unit: 1 (currency_codes.json), so 500000 minor units
    // is ¥500,000, not ¥5,000. A prior version of this resolver always
    // divided by 100, which is only correct for currencies like USD.
    const context = {
      privateViewingRoomLoader: jest.fn().mockResolvedValue({
        password_required: false,
        artworks: [
          {
            artwork_id: "artwork-1",
            price_cents: 500000,
            price_currency: "JPY",
          },
        ],
      }),
    }

    const result = await runQuery(query, context)

    // major = minor / subunit_to_unit (1 for JPY) = 500000, not 500000 / 100
    expect(result.privateViewingRoom.artworks[0].price.major).toEqual(500000)
    expect(result.privateViewingRoom.artworks[0].price.display).toEqual(
      "JPY ¥500,000"
    )
  })
})
