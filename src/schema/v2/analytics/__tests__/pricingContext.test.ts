import gql from "lib/gql"
import { HTTPError } from "lib/HTTPError"
import { runQuery } from "schema/v2/test/utils"
import { filtersDescription } from "../pricingContext"

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

const pricingContextResponse = {
  data: {
    applied_filters: {
      category: "ARCHITECTURE",
      dimension: "SMALL",
    },
    bins: [
      { max_price_cents: 8855, min_price_cents: 900, num_artworks: 67 },
      { max_price_cents: 16810, min_price_cents: 8855, num_artworks: 57 },
      { max_price_cents: 24765, min_price_cents: 16810, num_artworks: 45 },
      { max_price_cents: 32720, min_price_cents: 24765, num_artworks: 17 },
    ],
  },
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

const expectedPricingContext = {
  appliedFilters: {
    category: "ARCHITECTURE",
    dimension: "SMALL",
  },
  appliedFiltersDisplay:
    "Price ranges of small architecture works by Good Artist",
  bins: [
    {
      maxPrice: "$89",
      maxPriceCents: 8855,
      minPrice: "$9",
      minPriceCents: 900,
      numArtworks: 67,
    },
    {
      maxPrice: "$168",
      maxPriceCents: 16810,
      minPrice: "$89",
      minPriceCents: 8855,
      numArtworks: 57,
    },
    {
      maxPrice: "$248",
      maxPriceCents: 24765,
      minPrice: "$168",
      minPriceCents: 16810,
      numArtworks: 45,
    },
    {
      maxPrice: "$327",
      maxPriceCents: 32720,
      minPrice: "$248",
      minPriceCents: 24765,
      numArtworks: 17,
    },
  ],
}

describe("Artwork.pricingContext", () => {
  let artworkLoader: jest.Mock
  let artistLoader: jest.Mock
  let salesLoader: jest.Mock
  let pricingContextLoader: jest.Mock
  let context: Record<string, any>

  beforeEach(() => {
    artworkLoader = jest.fn().mockResolvedValue(artwork)
    artistLoader = jest.fn().mockResolvedValue(artist)
    salesLoader = jest.fn().mockResolvedValue([{ _id: "sale-1" }])
    pricingContextLoader = jest.fn().mockResolvedValue(pricingContextResponse)
    context = {
      meLoader: jest.fn().mockResolvedValue({}),
      artworkLoader,
      artistLoader,
      salesLoader,
      unauthenticatedLoaders: { artistLoader, pricingContextLoader },
    }
  })

  const pricingContextFor = async (attributes: Record<string, any>) => {
    artworkLoader.mockResolvedValueOnce(attributes)
    const result = await runQuery(query, context)
    return result.artwork.pricingContext
  }

  it("is accessible through the artwork type", async () => {
    const result = await runQuery(query, context)

    expect(result.artwork.pricingContext).toEqual(expectedPricingContext)
    expect(pricingContextLoader).toHaveBeenCalledWith({
      artist_id: "artist-id",
      category: "PAINTING",
      size_score: 225,
    })
    expect(artistLoader).toHaveBeenCalledWith("artist-slug")
  })

  it("maps categories correctly", async () => {
    await pricingContextFor({
      ...artwork,
      category: "Drawing, Collage or other Work on Paper",
    })

    expect(pricingContextLoader).toHaveBeenCalledWith({
      artist_id: "artist-id",
      category: "DRAWING_COLLAGE_OTHER_WORK_ON_PAPER",
      size_score: 225,
    })
  })

  it("rounds the size score", async () => {
    await pricingContextFor({ ...artwork, size_score: 224.5 })

    expect(pricingContextLoader).toHaveBeenCalledWith(
      expect.objectContaining({ size_score: 225 })
    )
  })

  it("uses the most expensive edition set dimensions when there is more than one edition set", async () => {
    await pricingContextFor({
      ...artwork,
      size_score: null,
      edition_sets: [
        {
          size_score: 600,
          price_cents: [124, 235],
          price_currency: "USD",
        },
        {
          size_score: 3000,
          price_cents: [154, 185],
          price_currency: "USD",
        },
        {
          size_score: 10300,
          price_cents: [12443], // THIS ONE SHOULD BE CHOSEN
          price_currency: "USD",
        },
      ],
    })
    expect(pricingContextLoader).toHaveBeenLastCalledWith({
      artist_id: "artist-id",
      category: "PAINTING",
      size_score: 10300,
    })

    await pricingContextFor({
      ...artwork,
      edition_sets: [
        {
          size_score: 600,
          price_cents: [124, 235],
          price_currency: "USD",
        },
        {
          size_score: 3000,
          price_cents: [154, 18555], // THIS ONE SHOULD BE CHOSEN
          price_currency: "USD",
        },
        {
          size_score: 10300,
          price_cents: [12443],
          price_currency: "USD",
        },
      ],
    })
    expect(pricingContextLoader).toHaveBeenLastCalledWith({
      artist_id: "artist-id",
      category: "PAINTING",
      size_score: 3000,
    })
  })

  it("prefers the last of equally priced editions", async () => {
    await pricingContextFor({
      ...artwork,
      edition_sets: [
        { size_score: 600, price_cents: [234], price_currency: "USD" },
        { size_score: 700, price_cents: [234], price_currency: "USD" },
      ],
    })

    expect(pricingContextLoader).toHaveBeenCalledWith(
      expect.objectContaining({ size_score: 700 })
    )
  })

  it("is null when dimensions not present", async () => {
    const { size_score, ...others } = artwork
    expect(await pricingContextFor(others)).toBeNull()
    expect(pricingContextLoader).not.toHaveBeenCalled()
  })

  it("is null when artist details are not present", async () => {
    const { artist, ...others } = artwork
    expect(await pricingContextFor(others)).toBeNull()
    expect(pricingContextLoader).not.toHaveBeenCalled()
  })

  it("is null when the artist can't be loaded", async () => {
    artistLoader.mockRejectedValueOnce(new Error("Not Found"))
    expect(await pricingContextFor(artwork)).toBeNull()
    expect(pricingContextLoader).not.toHaveBeenCalled()
  })

  it("is null when category is not present", async () => {
    const { category, ...others } = artwork
    expect(await pricingContextFor(others)).toBeNull()
  })

  it("is null when list price is not public", async () => {
    expect(
      await pricingContextFor({ ...artwork, price_hidden: true })
    ).toBeNull()
  })

  it("works when the user is not authenticated", async () => {
    const { meLoader, ...others } = context
    const result = await runQuery(query, others)
    expect(result.artwork.pricingContext).toEqual(expectedPricingContext)
  })

  it("is null when there is no list price", async () => {
    const { price_cents, ...others } = artwork
    expect(await pricingContextFor(others)).toBeNull()
  })

  it("is null when a price range has no maximum", async () => {
    // The stitched resolver threw reading the missing maxPrice.
    expect(
      await pricingContextFor({ ...artwork, price_cents: [100, null] })
    ).toBeNull()
  })

  it("is null when the artwork is not for sale", async () => {
    expect(await pricingContextFor({ ...artwork, forsale: false })).toBeNull()
  })

  it("is null when the artwork is sold", async () => {
    expect(await pricingContextFor({ ...artwork, sold: true })).toBeNull()
  })

  it("is null when the artwork is in an auction", async () => {
    expect(
      await pricingContextFor({ ...artwork, sale_ids: ["sale-1"] })
    ).toBeNull()
    expect(salesLoader).toHaveBeenCalledWith({
      id: ["sale-1"],
      is_auction: true,
    })
    expect(pricingContextLoader).not.toHaveBeenCalled()
  })

  it("is not null when the artwork's sales are not auctions", async () => {
    salesLoader.mockResolvedValueOnce([])
    expect(
      await pricingContextFor({ ...artwork, sale_ids: ["sale-1"] })
    ).toEqual(expectedPricingContext)
  })

  it("is null when the artwork has multiple artists", async () => {
    expect(
      await pricingContextFor({
        ...artwork,
        artists: [{ id: "artist1" }, { id: "artist2" }],
      })
    ).toBeNull()
  })

  it("is null when the artwork is not in USD", async () => {
    expect(
      await pricingContextFor({ ...artwork, price_currency: "GBP" })
    ).toBeNull()
  })

  it("is null when category is OTHER", async () => {
    expect(
      await pricingContextFor({ ...artwork, category: "OTHER" })
    ).toBeNull()
    expect(
      await pricingContextFor({ ...artwork, category: "Other" })
    ).toBeNull()
    expect(pricingContextLoader).not.toHaveBeenCalled()
  })

  it("is null when artist is disabled for price context", async () => {
    artistLoader.mockResolvedValueOnce({
      ...artist,
      disable_price_context: true,
    })
    expect(await pricingContextFor(artwork)).toBeNull()
    expect(pricingContextLoader).not.toHaveBeenCalled()
  })

  it("is null when Vortex has no histogram", async () => {
    pricingContextLoader.mockResolvedValueOnce({ data: null })
    expect(await pricingContextFor(artwork)).toBeNull()
  })

  it("describes the filters Vortex applied with the artwork's artist names", async () => {
    pricingContextLoader.mockResolvedValueOnce({
      data: {
        applied_filters: { category: "PRINT", dimension: null },
        bins: [],
      },
    })

    expect(
      await pricingContextFor({ ...artwork, cultural_maker: "American" })
    ).toEqual({
      appliedFilters: { category: "PRINT", dimension: null },
      appliedFiltersDisplay: "Price ranges of prints by American",
      bins: [],
    })
  })

  it("surfaces Vortex errors as field errors", async () => {
    pricingContextLoader.mockRejectedValueOnce(new HTTPError("Boom", 500))

    await expect(runQuery(query, context)).rejects.toThrow("Boom")
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
