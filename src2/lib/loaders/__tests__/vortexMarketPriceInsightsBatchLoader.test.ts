import { createMarketPriceInsightsBatchLoader } from "lib/loaders/vortexMarketPriceInsightsBatchLoader"

const restInsight = (artistId: string, medium: string, overrides = {}) => ({
  id: "1",
  artist_id: artistId,
  artist_name: "Artist",
  medium,
  annual_lots_sold: 12,
  annual_value_sold_cents: 123456789012,
  demand_rank: 0.84,
  last_auction_result_date: "2026-09-01T12:00:00Z",
  liquidity_rank: 0.7,
  median_sale_over_estimate_percentage: 25,
  median_sale_price_last_36_months: 4500000,
  sell_through_rate: 0.9,
  ...overrides,
})

describe("createMarketPriceInsightsBatchLoader", () => {
  let restLoader: jest.Mock

  beforeEach(() => {
    restLoader = jest.fn(async ({ tuples }) => ({
      data: tuples
        .filter(({ artist_id }) => artist_id !== "no-insights")
        .map(({ artist_id, medium }) => restInsight(artist_id, medium)),
    }))
  })

  it("returns insights in the shape the stitched batch query did", async () => {
    restLoader.mockResolvedValueOnce({
      data: [
        restInsight("artist-1", "Painting"),
        restInsight("artist-2", "Print", {
          annual_value_sold_cents: null,
          median_sale_price_last_36_months: null,
        }),
      ],
    })
    const loader = createMarketPriceInsightsBatchLoader(restLoader)

    expect(
      await loader([
        { artistId: "artist-1", category: "Painting" },
        { artistId: "artist-2", category: "Print" },
      ])
    ).toEqual([
      {
        annualLotsSold: 12,
        annualValueSoldCents: "123456789012",
        artistId: "artist-1",
        demandRank: 0.84,
        lastAuctionResultDate: "2026-09-01T12:00:00Z",
        medianSalePriceLast36Months: "4500000",
        medium: "Painting",
        sellThroughRate: 0.9,
        medianSaleOverEstimatePercentage: 25,
        liquidityRank: 0.7,
      },
      expect.objectContaining({
        artistId: "artist-2",
        annualValueSoldCents: null,
        medianSalePriceLast36Months: null,
      }),
    ])
    expect(restLoader).toHaveBeenCalledWith({
      tuples: [
        { artist_id: "artist-1", medium: "Painting" },
        { artist_id: "artist-2", medium: "Print" },
      ],
    })
  })

  it("merges calls made in the same tick into one request", async () => {
    const loader = createMarketPriceInsightsBatchLoader(restLoader)

    const [first, second] = await Promise.all([
      loader([{ artistId: "artist-1", category: "Painting" }]),
      loader([{ artistId: "artist-2", category: "Sculpture" }]),
    ])

    expect(first.map(({ artistId }) => artistId)).toEqual(["artist-1"])
    expect(second.map(({ artistId }) => artistId)).toEqual(["artist-2"])
    expect(restLoader).toHaveBeenCalledTimes(1)
  })

  it("asks for each pair once, matching mediums case-insensitively", async () => {
    restLoader.mockResolvedValueOnce({
      data: [restInsight("artist-1", "Painting")],
    })
    const loader = createMarketPriceInsightsBatchLoader(restLoader)

    const insights = await loader([
      { artistId: "artist-1", category: "painting" },
      { artistId: "artist-1", category: "PAINTING" },
    ])

    expect(insights.map(({ medium }) => medium)).toEqual(["Painting"])
    expect(restLoader).toHaveBeenCalledWith({
      tuples: [{ artist_id: "artist-1", medium: "painting" }],
    })
  })

  it("skips pairs without an artist or category, and pairs without insights", async () => {
    const loader = createMarketPriceInsightsBatchLoader(restLoader)

    const insights = await loader([
      { artistId: "artist-1", category: "Painting" },
      { artistId: "artist-2" },
      { category: "Painting" },
      { artistId: "no-insights", category: "Painting" },
    ])

    expect(insights.map(({ artistId }) => artistId)).toEqual(["artist-1"])
    expect(restLoader.mock.calls[0][0].tuples).toHaveLength(2)
  })

  it("makes no request when no pair is complete", async () => {
    const loader = createMarketPriceInsightsBatchLoader(restLoader)

    expect(await loader([{ artistId: "artist-1", medium: "Oil" }])).toEqual([])
    expect(restLoader).not.toHaveBeenCalled()
  })

  it("splits more than 100 pairs into several requests", async () => {
    const loader = createMarketPriceInsightsBatchLoader(restLoader)

    const insights = await loader(
      Array.from({ length: 150 }, (_, i) => ({
        artistId: `artist-${i}`,
        category: "Painting",
      }))
    )

    expect(insights).toHaveLength(150)
    expect(restLoader.mock.calls.map(([{ tuples }]) => tuples.length)).toEqual([
      100,
      50,
    ])
  })

  it("rejects when Vortex fails", async () => {
    restLoader.mockRejectedValueOnce(new Error("Boom"))
    const loader = createMarketPriceInsightsBatchLoader(restLoader)

    await expect(
      loader([{ artistId: "artist-1", category: "Painting" }])
    ).rejects.toThrow("Boom")
  })
})
