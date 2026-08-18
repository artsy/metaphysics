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
        passcode_required: false,
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
        passcode_required: false,
        artworks: [{ artwork_id: "artwork-1" }],
      }),
    }

    const result = await runQuery(query, context)

    expect(result.privateViewingRoom.artworks[0].price).toBeNull()
  })

  it("returns null price when there's a pinned price but no currency", async () => {
    const context = {
      privateViewingRoomLoader: jest.fn().mockResolvedValue({
        passcode_required: false,
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
        passcode_required: false,
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

describe("PrivateViewingRoomArtwork.editionInfo", () => {
  const query = gql`
    {
      privateViewingRoom(slug: "some-gallery-for-anna") {
        artworks {
          editionInfo {
            editionSetID
            priceCents
            priceCurrency
            price {
              minor
              major
              currencyCode
              display
            }
            availability
            editionSize
            inventoryCount
          }
        }
      }
    }
  `

  it("returns one entry per edition set, each with its own pinned data", async () => {
    const context = {
      privateViewingRoomLoader: jest.fn().mockResolvedValue({
        passcode_required: false,
        artworks: [
          {
            artwork_id: "artwork-1",
            edition_info: [
              {
                edition_set_id: "edition-set-a",
                price_cents: 100000,
                price_currency: "USD",
                availability: "for sale",
                edition_size: "10",
                inventory_count: 3,
              },
              {
                edition_set_id: "edition-set-b",
                price_cents: 200000,
                price_currency: "USD",
                availability: "sold",
                edition_size: "25",
                inventory_count: 7,
              },
            ],
          },
        ],
      }),
    }

    const result = await runQuery(query, context)

    expect(result.privateViewingRoom.artworks[0].editionInfo).toEqual([
      {
        editionSetID: "edition-set-a",
        priceCents: 100000,
        priceCurrency: "USD",
        price: {
          minor: 100000,
          major: 1000,
          currencyCode: "USD",
          display: "US$1,000",
        },
        availability: "for sale",
        editionSize: "10",
        inventoryCount: 3,
      },
      {
        editionSetID: "edition-set-b",
        priceCents: 200000,
        priceCurrency: "USD",
        price: {
          minor: 200000,
          major: 2000,
          currencyCode: "USD",
          display: "US$2,000",
        },
        availability: "sold",
        editionSize: "25",
        inventoryCount: 7,
      },
    ])
  })

  it("returns an empty list when the artwork has no edition sets", async () => {
    const context = {
      privateViewingRoomLoader: jest.fn().mockResolvedValue({
        passcode_required: false,
        artworks: [{ artwork_id: "artwork-1", edition_info: [] }],
      }),
    }

    const result = await runQuery(query, context)

    expect(result.privateViewingRoom.artworks[0].editionInfo).toEqual([])
  })

  it("returns null price/availability/size/inventory on an entry when those sub-fields aren't visible, but keeps editionSetID", async () => {
    const context = {
      privateViewingRoomLoader: jest.fn().mockResolvedValue({
        passcode_required: false,
        artworks: [
          {
            artwork_id: "artwork-1",
            edition_info: [{ edition_set_id: "edition-set-a" }],
          },
        ],
      }),
    }

    const result = await runQuery(query, context)

    expect(result.privateViewingRoom.artworks[0].editionInfo).toEqual([
      {
        editionSetID: "edition-set-a",
        priceCents: null,
        priceCurrency: null,
        price: null,
        availability: null,
        editionSize: null,
        inventoryCount: null,
      },
    ])
  })
})

describe("PrivateViewingRoomArtwork.location / coa fields", () => {
  const query = gql`
    {
      privateViewingRoom(slug: "some-gallery-for-anna") {
        artworks {
          location
          coaByGallery
          coaByAuthenticatingBody
        }
      }
    }
  `

  it("returns the pinned location and coa fields when visible", async () => {
    const context = {
      privateViewingRoomLoader: jest.fn().mockResolvedValue({
        passcode_required: false,
        artworks: [
          {
            artwork_id: "artwork-1",
            location: "Buffalo, Indiana, US, 38203",
            coa_by_gallery: true,
            coa_by_authenticating_body: false,
          },
        ],
      }),
    }

    const result = await runQuery(query, context)

    expect(result.privateViewingRoom.artworks[0]).toEqual({
      location: "Buffalo, Indiana, US, 38203",
      coaByGallery: true,
      coaByAuthenticatingBody: false,
    })
  })

  it("returns null for location/coa fields when not visible", async () => {
    const context = {
      privateViewingRoomLoader: jest.fn().mockResolvedValue({
        passcode_required: false,
        artworks: [{ artwork_id: "artwork-1" }],
      }),
    }

    const result = await runQuery(query, context)

    expect(result.privateViewingRoom.artworks[0]).toEqual({
      location: null,
      coaByGallery: null,
      coaByAuthenticatingBody: null,
    })
  })
})
