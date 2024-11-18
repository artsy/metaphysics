import { runQuery } from "schema/v2/test/utils"
import gql from "lib/gql"
import { ResolverContext } from "types/graphql"
import { filtersDescription } from "../v2/stitching"
import config from "config"

jest.mock("../link")
const mockFetch = require("../link").mockFetch as jest.Mock<any>

describe("PricingContext type", () => {
  beforeEach(() => {
    config.VORTEX_TOKEN = "vortex-token"
  })
  const artwork = {
    artist: {
      id: "artist-slug",
      _id: "artist-id",
    },
    artists: [
      {
        _id: "artist-1",
        name: "Good Artist",
      },
    ],
    category: "Painting",
    price_hidden: false,
    size_score: 225,
    edition_sets: null,
    forsale: true,
    is_in_auction: false,
    price_currency: "USD",
    price_cents: [234],
  }
  const artist = {
    _id: "artist-id",
    name: "Good Artist",
    disable_price_context: false,
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
  const artworkLoader = jest.fn().mockResolvedValue(artwork)
  const artistLoader = jest.fn().mockResolvedValue(artist)
  const salesLoader = jest.fn().mockResolvedValue([
    {
      _id: "sale-1",
    },
  ])
  const context: Partial<
    Omit<ResolverContext, "authenticatedLoaders" | "unauthenticatedLoaders"> & {
      authenticatedLoaders: Partial<ResolverContext["authenticatedLoaders"]>
      unauthenticatedLoaders: Partial<ResolverContext["unauthenticatedLoaders"]>
    }
  > = {
    meLoader,
    artworkLoader,
    artistLoader,
    salesLoader,
    unauthenticatedLoaders: { artistLoader },
  }
  const query = gql`
    query {
      artwork(id: "lol") {
        pricingContext {
          appliedFilters {
            category
            dimension
          }
          appliedFiltersDisplay
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
      {
        "artwork": {
          "pricingContext": {
            "appliedFilters": {
              "category": "ARCHITECTURE",
              "dimension": "SMALL",
            },
            "appliedFiltersDisplay": "Price ranges of small architecture works by Good Artist",
            "bins": [
              {
                "maxPrice": "$89",
                "maxPriceCents": 8855,
                "minPrice": "$9",
                "minPriceCents": 900,
                "numArtworks": 67,
              },
              {
                "maxPrice": "$168",
                "maxPriceCents": 16810,
                "minPrice": "$89",
                "minPriceCents": 8855,
                "numArtworks": 57,
              },
              {
                "maxPrice": "$248",
                "maxPriceCents": 24765,
                "minPrice": "$168",
                "minPriceCents": 16810,
                "numArtworks": 45,
              },
              {
                "maxPrice": "$327",
                "maxPriceCents": 32720,
                "minPrice": "$248",
                "minPriceCents": 24765,
                "numArtworks": 17,
              },
            ],
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
      {
        "_v0_artistId": "artist-id",
        "_v0_category": "DRAWING_COLLAGE_OTHER_WORK_ON_PAPER",
        "_v0_sizeScore": 225,
      }
    `)
  })

  it("uses the most expensive edition set dimensions when there is more than one edition set", async () => {
    artworkLoader.mockResolvedValueOnce({
      ...artwork,
      size_score: null,
      edition_sets: [
        {
          size_score: 600,
          price_cents: [124, 235],
        },
        {
          size_score: 3000,
          price_cents: [154, 185],
        },
        {
          size_score: 10300,
          price_cents: [12443], // THIS ONE SHOULD BE CHOSEN
        },
      ],
    })
    await runQuery(query, context)
    expect(JSON.parse(mockFetch.mock.calls[0][1].body).variables)
      .toMatchInlineSnapshot(`
      {
        "_v0_artistId": "artist-id",
        "_v0_category": "PAINTING",
        "_v0_sizeScore": 10300,
      }
    `)
    mockFetch.mockClear()

    artworkLoader.mockResolvedValueOnce({
      ...artwork,
      edition_sets: [
        {
          size_score: 600,
          price_cents: [124, 235],
        },
        {
          size_score: 3000,
          price_cents: [154, 18555], // THIS ONE SHOULD BE CHOSEN
        },
        {
          size_score: 10300,
          price_cents: [12443],
        },
      ],
    })
    await runQuery(query, context)
    expect(JSON.parse(mockFetch.mock.calls[0][1].body).variables)
      .toMatchInlineSnapshot(`
      {
        "_v0_artistId": "artist-id",
        "_v0_category": "PAINTING",
        "_v0_sizeScore": 3000,
      }
    `)
  })

  it("is null when dimensions not present", async () => {
    const { size_score, ...others } = artwork
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

  it("works when the user is not authenticated", async () => {
    const { meLoader, ...others } = context
    const result = (await runQuery(query, others)) as any
    expect(result).toMatchInlineSnapshot(`
      {
        "artwork": {
          "pricingContext": {
            "appliedFilters": {
              "category": "ARCHITECTURE",
              "dimension": "SMALL",
            },
            "appliedFiltersDisplay": "Price ranges of small architecture works by Good Artist",
            "bins": [
              {
                "maxPrice": "$89",
                "maxPriceCents": 8855,
                "minPrice": "$9",
                "minPriceCents": 900,
                "numArtworks": 67,
              },
              {
                "maxPrice": "$168",
                "maxPriceCents": 16810,
                "minPrice": "$89",
                "minPriceCents": 8855,
                "numArtworks": 57,
              },
              {
                "maxPrice": "$248",
                "maxPriceCents": 24765,
                "minPrice": "$168",
                "minPriceCents": 16810,
                "numArtworks": 45,
              },
              {
                "maxPrice": "$327",
                "maxPriceCents": 32720,
                "minPrice": "$248",
                "minPriceCents": 24765,
                "numArtworks": 17,
              },
            ],
          },
        },
      }
    `)
  })

  it("is null when there is no list price", async () => {
    const { price_cents, ...others } = artwork
    artworkLoader.mockResolvedValueOnce(others)
    const result = (await runQuery(query, context)) as any
    expect(result.artwork.pricingContext).toBeNull()
  })

  it("is null when the artwork is not for sale", async () => {
    artworkLoader.mockResolvedValueOnce({
      ...artwork,
      forsale: false,
    })
    const result = (await runQuery(query, context)) as any
    expect(result.artwork.pricingContext).toBeNull()
  })

  it("is null when the artwork is in an auction", async () => {
    artworkLoader.mockResolvedValueOnce({
      ...artwork,
      sale_ids: ["sale-1"],
    })
    const result = (await runQuery(query, context)) as any
    expect(result.artwork.pricingContext).toBeNull()
  })

  it("is null when the artwork has multiple artists", async () => {
    artworkLoader.mockResolvedValueOnce({
      ...artwork,
      artists: [{ id: "artist1" }, { id: "artist2" }],
    })
    const result = (await runQuery(query, context)) as any
    expect(result.artwork.pricingContext).toBeNull()
  })

  it("is null when the artwork is not in USD", async () => {
    artworkLoader.mockResolvedValueOnce({
      ...artwork,
      price_currency: "GBP",
    })
    const result = (await runQuery(query, context)) as any
    expect(result.artwork.pricingContext).toBeNull()
  })

  it("is null when category is OTHER", async () => {
    artworkLoader.mockResolvedValueOnce({
      ...artwork,
      category: "OTHER",
    })
    const result = (await runQuery(query, context)) as any
    expect(result.artwork.pricingContext).toBeNull()
  })

  it("is null when artist is disabled for price context", async () => {
    artistLoader.mockResolvedValueOnce({
      ...artist,
      disable_price_context: true,
    })
    const result = (await runQuery(query, context)) as any
    expect(result.artwork.pricingContext).toBeNull()
  })
})

describe("filtersDescription", () => {
  it("returns correct description with all filters", async () => {
    expect(
      filtersDescription(
        { category: "ARCHITECTURE", dimension: "SMALL" },
        "Great Artist"
      )
    ).toEqual("Price ranges of small architecture works by Great Artist")
  })

  it("returns correct description with category only filter", async () => {
    expect(
      filtersDescription(
        { category: "ARCHITECTURE", dimension: null },
        "Great Artist"
      )
    ).toEqual("Price ranges of architecture works by Great Artist")
  })

  it("returns correct description with dimension only filter", async () => {
    expect(
      filtersDescription(
        { category: null, dimension: "MEDIUM" },
        "Great Artist"
      )
    ).toEqual("Price ranges of medium-sized works by Great Artist")
  })

  it("returns correct description with no applied filter", async () => {
    expect(
      filtersDescription({ category: null, dimension: null }, "Great Artist")
    ).toEqual("Price ranges of works by Great Artist")
  })
})
