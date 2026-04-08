import { runQuery } from "schema/v2/test/utils"
import gql from "lib/gql"

describe("Artwork.catalogArtwork", () => {
  const mockArtworkWithCatalogArtwork = (catalogArtwork) => () =>
    Promise.resolve({
      id: "some-artwork",
      _id: "artwork-internal-id",
      title: "Some Artwork",
      catalog_artwork: catalogArtwork,
    })

  it("returns null when catalog_artwork is not present", async () => {
    const query = gql`
      {
        artwork(id: "some-artwork") {
          catalogArtwork {
            internalID
          }
        }
      }
    `

    const data = await runQuery(query, {
      artworkLoader: mockArtworkWithCatalogArtwork(null),
    })

    expect(data).toEqual({ artwork: { catalogArtwork: null } })
  })

  it("returns catalog artwork fields", async () => {
    const query = gql`
      {
        artwork(id: "some-artwork") {
          catalogArtwork {
            internalID
            artworkId
            medium
            availability
            priceCurrency
            privateNotes
          }
        }
      }
    `

    const data = await runQuery(query, {
      artworkLoader: mockArtworkWithCatalogArtwork({
        id: "catalog-artwork-id",
        artwork_id: "some-artwork",
        medium: "Oil on canvas",
        availability: "for sale",
        price_currency: "USD",
        private_notes: "private notes",
      }),
    })

    expect(data).toEqual({
      artwork: {
        catalogArtwork: {
          internalID: "catalog-artwork-id",
          artworkId: "some-artwork",
          medium: "Oil on canvas",
          availability: "for sale",
          priceCurrency: "USD",
          privateNotes: "private notes",
        },
      },
    })
  })

  it("returns priceListed as a Money type", async () => {
    const query = gql`
      {
        artwork(id: "some-artwork") {
          catalogArtwork {
            priceListed {
              major
              minor
              currencyCode
              display
            }
          }
        }
      }
    `

    const data = await runQuery(query, {
      artworkLoader: mockArtworkWithCatalogArtwork({
        id: "catalog-artwork-id",
        price_minor: 150000,
        price_currency: "USD",
      }),
    })

    expect(data).toEqual({
      artwork: {
        catalogArtwork: {
          priceListed: {
            major: 1500,
            minor: 150000,
            currencyCode: "USD",
            display: "US$1,500",
          },
        },
      },
    })
  })

  it("returns createdAt and updatedAt dates", async () => {
    const query = gql`
      {
        artwork(id: "some-artwork") {
          catalogArtwork {
            createdAt
            updatedAt
          }
        }
      }
    `

    const data = await runQuery(query, {
      artworkLoader: mockArtworkWithCatalogArtwork({
        id: "catalog-artwork-id",
        created_at: "2024-01-15T10:30:00Z",
        updated_at: "2024-06-20T14:45:00Z",
      }),
    })

    expect(data).toEqual({
      artwork: {
        catalogArtwork: {
          createdAt: "2024-01-15T10:30:00Z",
          updatedAt: "2024-06-20T14:45:00Z",
        },
      },
    })
  })
})
