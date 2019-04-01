import { runQuery } from "test/utils"
import gql from "lib/gql"
import { ResolverContext } from "types/graphql"

jest.mock("../link")
const mockFetch = require("../link").mockFetch as jest.Mock<any>

describe("PricingContext type", () => {
  const artwork = {
    artist: {
      id: "artist-slug",
      _id: "artist-id",
    },
    category: "Painting",
    price_hidden: false,
    width_cm: 15,
    height_cm: 15,
    price_cents: [234],
  }
  const meLoader = jest.fn(() =>
    Promise.resolve({
      lab_features: [
        "Some lab feature",
        "Pricing Context",
        "Some other lab feature",
      ],
    })
  )
  const artworkLoader = jest.fn(() => Promise.resolve(artwork))
  const artistLoader = jest.fn(() =>
    Promise.resolve({
      _id: "artist-id",
    })
  )
  const context: Partial<ResolverContext> = {
    meLoader,
    artworkLoader,
    artistLoader,
  }
  const query = gql`
    query {
      artwork(id: "lol") {
        pricingContext {
          filterDescription
          bins {
            maxPrice
            maxPriceCents
            minPrice
            minPriceCents
            numArtworks
          }
        }
      }
    }
  `

  it("is accessible through the artwork type", async () => {
    const result = await runQuery(query, context)
    expect(result).toMatchInlineSnapshot(`
Object {
  "artwork": Object {
    "pricingContext": Object {
      "bins": Array [
        Object {
          "maxPrice": "$89",
          "maxPriceCents": 8855,
          "minPrice": "$9",
          "minPriceCents": 900,
          "numArtworks": 67,
        },
        Object {
          "maxPrice": "$168",
          "maxPriceCents": 16810,
          "minPrice": "$89",
          "minPriceCents": 8855,
          "numArtworks": 57,
        },
        Object {
          "maxPrice": "$248",
          "maxPriceCents": 24765,
          "minPrice": "$168",
          "minPriceCents": 16810,
          "numArtworks": 45,
        },
        Object {
          "maxPrice": "$327",
          "maxPriceCents": 32720,
          "minPrice": "$248",
          "minPriceCents": 24765,
          "numArtworks": 17,
        },
      ],
      "filterDescription": "Small mocks by David Sheldrick",
    },
  },
}
`)
  })

  it("maps categories correctly", async () => {
    artworkLoader.mockResolvedValueOnce({
      ...artwork,
      category: "Drawing, Collage or other Work on Paper",
    })
    mockFetch.mockClear()
    await runQuery(query, context)
    expect(JSON.parse(mockFetch.mock.calls[0][1].body).variables)
      .toMatchInlineSnapshot(`
Object {
  "_v0_artistId": "artist-id",
  "_v1_category": "DRAWING_COLAGE_OTHER_WORK_ON_PAPER",
  "_v2_heightCm": 15,
  "_v3_widthCm": 15,
}
`)
  })

  it("is null when dimensions not present", async () => {
    const { width_cm, height_cm, ...others } = artwork
    artworkLoader.mockResolvedValueOnce(others)
    const result = (await runQuery(query, context)) as any
    expect(result.artwork.pricingContext).toBeNull()
  })

  it("is null when artist details are not present", async () => {
    const { artist, ...others } = artwork
    artworkLoader.mockResolvedValueOnce(others)
    const result = (await runQuery(query, context)) as any
    expect(result.artwork.pricingContext).toBeNull()
  })

  it("is null when category is not present", async () => {
    const { category, ...others } = artwork
    artworkLoader.mockResolvedValueOnce(others)
    const result = (await runQuery(query, context)) as any
    expect(result.artwork.pricingContext).toBeNull()
  })

  it("is null when list price is not public", async () => {
    artworkLoader.mockResolvedValueOnce({
      ...artwork,
      price_hidden: true,
    })
    const result = (await runQuery(query, context)) as any
    expect(result.artwork.pricingContext).toBeNull()
  })

  it("is null when not authenticated", async () => {
    const { meLoader, ...others } = context
    const result = (await runQuery(query, others)) as any
    expect(result.artwork.pricingContext).toBeNull()
  })

  it("is null when user is not in lab feature", async () => {
    meLoader.mockResolvedValueOnce({
      lab_features: ["some other lab feature"],
    })
    const result = (await runQuery(query, context)) as any
    expect(result.artwork.pricingContext).toBeNull()
  })

  it("is null when user has no lab features", async () => {
    meLoader.mockResolvedValueOnce({
      lab_features: [],
    })
    const result = (await runQuery(query, context)) as any
    expect(result.artwork.pricingContext).toBeNull()
  })

  it("is null when there is not list price", async () => {
    const { price_cents, ...others } = artwork
    artworkLoader.mockResolvedValueOnce(others)
    const result = (await runQuery(query, context)) as any
    expect(result.artwork.pricingContext).toBeNull()
  })
})
