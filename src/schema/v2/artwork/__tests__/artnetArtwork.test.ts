import { runQuery } from "schema/v2/test/utils"
import gql from "lib/gql"

describe("CatalogArtwork.artnetArtwork", () => {
  const mockArtworkWithArtnetArtwork = (artnetArtwork) => () =>
    Promise.resolve({
      id: "some-artwork",
      _id: "artwork-internal-id",
      title: "Some Artwork",
      catalog_artwork: {
        id: "catalog-artwork-id",
        artnet_artwork: artnetArtwork,
      },
    })

  it("returns null when artnet_artwork is not present", async () => {
    const query = gql`
      {
        artwork(id: "some-artwork") {
          catalogArtwork {
            artnetArtwork {
              internalID
            }
          }
        }
      }
    `

    const data = await runQuery(query, {
      artworkLoader: mockArtworkWithArtnetArtwork(null),
    })

    expect(data).toEqual({
      artwork: { catalogArtwork: { artnetArtwork: null } },
    })
  })

  it("returns scalar fields", async () => {
    const query = gql`
      {
        artwork(id: "some-artwork") {
          catalogArtwork {
            artnetArtwork {
              internalID
              artnetId
              availability
              published
              priceCurrency
              mediums
            }
          }
        }
      }
    `

    const data = await runQuery(query, {
      artworkLoader: mockArtworkWithArtnetArtwork({
        id: "artnet-artwork-id",
        artnet_id: "12345",
        availability: "Price on Request",
        published: true,
        price_currency: "USD",
        mediums: ["Paintings", "Works on paper"],
      }),
    })

    expect(data).toEqual({
      artwork: {
        catalogArtwork: {
          artnetArtwork: {
            internalID: "artnet-artwork-id",
            artnetId: "12345",
            availability: "Price on Request",
            published: true,
            priceCurrency: "USD",
            mediums: ["Paintings", "Works on paper"],
          },
        },
      },
    })
  })

  it("returns an empty list when mediums is not present", async () => {
    const query = gql`
      {
        artwork(id: "some-artwork") {
          catalogArtwork {
            artnetArtwork {
              mediums
            }
          }
        }
      }
    `

    const data = await runQuery(query, {
      artworkLoader: mockArtworkWithArtnetArtwork({
        id: "artnet-artwork-id",
      }),
    })

    expect(data).toEqual({
      artwork: { catalogArtwork: { artnetArtwork: { mediums: [] } } },
    })
  })

  it("returns priceFrom as a Money type and priceTo as null when absent", async () => {
    const query = gql`
      {
        artwork(id: "some-artwork") {
          catalogArtwork {
            artnetArtwork {
              priceFrom {
                major
                minor
                currencyCode
                display
              }
              priceTo {
                major
              }
            }
          }
        }
      }
    `

    const data = await runQuery(query, {
      artworkLoader: mockArtworkWithArtnetArtwork({
        id: "artnet-artwork-id",
        price_from_minor: 250000,
        price_currency: "USD",
      }),
    })

    expect(data).toEqual({
      artwork: {
        catalogArtwork: {
          artnetArtwork: {
            priceFrom: {
              major: 2500,
              minor: 250000,
              currencyCode: "USD",
              display: "US$2,500",
            },
            priceTo: null,
          },
        },
      },
    })
  })

  it("returns null for priceFrom when price_currency is missing, without throwing", async () => {
    const query = gql`
      {
        artwork(id: "some-artwork") {
          catalogArtwork {
            artnetArtwork {
              priceFrom {
                major
              }
            }
          }
        }
      }
    `

    const data = await runQuery(query, {
      artworkLoader: mockArtworkWithArtnetArtwork({
        id: "artnet-artwork-id",
        price_from_minor: 250000,
        price_currency: null,
      }),
    })

    expect(data).toEqual({
      artwork: {
        catalogArtwork: { artnetArtwork: { priceFrom: null } },
      },
    })
  })

  it("returns nested artnetEditionSets", async () => {
    const query = gql`
      {
        artwork(id: "some-artwork") {
          catalogArtwork {
            artnetArtwork {
              artnetEditionSets {
                internalID
                catalogEditionSetId
                artnetId
                label
                availability
                priceFrom {
                  major
                }
                priceTo {
                  major
                }
              }
            }
          }
        }
      }
    `

    const data = await runQuery(query, {
      artworkLoader: mockArtworkWithArtnetArtwork({
        id: "artnet-artwork-id",
        artnet_edition_sets: [
          {
            id: "artnet-edition-set-1",
            catalog_edition_set_id: "catalog-edition-set-1",
            artnet_id: 1000,
            label: "Edition of 10",
            availability: "For Sale",
            price_from_minor: 100000,
            price_to_minor: 200000,
            price_currency: "USD",
          },
        ],
      }),
    })

    expect(data).toEqual({
      artwork: {
        catalogArtwork: {
          artnetArtwork: {
            artnetEditionSets: [
              {
                internalID: "artnet-edition-set-1",
                catalogEditionSetId: "catalog-edition-set-1",
                artnetId: "1000",
                label: "Edition of 10",
                availability: "For Sale",
                priceFrom: { major: 1000 },
                priceTo: { major: 2000 },
              },
            ],
          },
        },
      },
    })
  })

  it("returns an empty list when artnet_edition_sets is not present", async () => {
    const query = gql`
      {
        artwork(id: "some-artwork") {
          catalogArtwork {
            artnetArtwork {
              artnetEditionSets {
                internalID
              }
            }
          }
        }
      }
    `

    const data = await runQuery(query, {
      artworkLoader: mockArtworkWithArtnetArtwork({
        id: "artnet-artwork-id",
      }),
    })

    expect(data).toEqual({
      artwork: {
        catalogArtwork: { artnetArtwork: { artnetEditionSets: [] } },
      },
    })
  })

  it("returns createdAt and updatedAt dates", async () => {
    const query = gql`
      {
        artwork(id: "some-artwork") {
          catalogArtwork {
            artnetArtwork {
              createdAt
              updatedAt
            }
          }
        }
      }
    `

    const data = await runQuery(query, {
      artworkLoader: mockArtworkWithArtnetArtwork({
        id: "artnet-artwork-id",
        created_at: "2024-01-15T10:30:00Z",
        updated_at: "2024-06-20T14:45:00Z",
      }),
    })

    expect(data).toEqual({
      artwork: {
        catalogArtwork: {
          artnetArtwork: {
            createdAt: "2024-01-15T10:30:00Z",
            updatedAt: "2024-06-20T14:45:00Z",
          },
        },
      },
    })
  })
})
