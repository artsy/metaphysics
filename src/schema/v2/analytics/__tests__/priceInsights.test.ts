import { graphql, GraphQLObjectType, GraphQLSchema } from "graphql"
import { priceInsightsRootFields } from "../priceInsights"

const schema = new GraphQLSchema({
  query: new GraphQLObjectType({
    name: "Query",
    fields: priceInsightsRootFields,
  }),
})

const runQuery = async (source: string, loaders: Record<string, jest.Mock>) => {
  const result = await graphql({
    schema,
    source,
    contextValue: { unauthenticatedLoaders: loaders },
  })
  if (result.errors) throw result.errors[0]
  return result.data as any
}

const priceInsight = (attributes = {}) => ({
  id: "1",
  artist_id: "artist-1",
  artist_name: "Andy Warhol",
  medium: "Painting",
  annual_lots_sold: 12,
  annual_value_sold_cents: 9876543210,
  demand_rank: 0.85,
  lots_sold_last_36_months: 30,
  median_sale_price_last_36_months: 4200000,
  median_sale_over_estimate_percentage: 120,
  last_auction_result_date: "2026-09-01T00:00:00Z",
  ...attributes,
})

describe("priceInsightsRootFields", () => {
  describe("marketPriceInsights", () => {
    it("maps Vortex's snake_case keys and returns BigInts as strings", async () => {
      const marketPriceInsightsLoader = jest
        .fn()
        .mockResolvedValue({ data: priceInsight() })

      const { marketPriceInsights } = await runQuery(
        `{
          marketPriceInsights(artistId: "artist-1", medium: "Painting") {
            id
            artistName
            annualLotsSold
            annualValueSoldCents
            demandRank
            lotsSoldLast36Months
            medianSalePriceLast36Months
            medianSaleOverEstimatePercentage
            lastAuctionResultDate
          }
        }`,
        { marketPriceInsightsLoader }
      )

      expect(marketPriceInsightsLoader).toHaveBeenCalledWith({
        artist_id: "artist-1",
        medium: "Painting",
      })
      expect(marketPriceInsights).toEqual({
        id: "1",
        artistName: "Andy Warhol",
        annualLotsSold: 12,
        annualValueSoldCents: "9876543210",
        demandRank: 0.85,
        lotsSoldLast36Months: 30,
        medianSalePriceLast36Months: "4200000",
        medianSaleOverEstimatePercentage: 120,
        lastAuctionResultDate: "2026-09-01T00:00:00Z",
      })
    })

    it("returns null for a market without insights", async () => {
      const marketPriceInsightsLoader = jest
        .fn()
        .mockResolvedValue({ data: null })

      const {
        marketPriceInsights,
      } = await runQuery(
        `{ marketPriceInsights(artistId: "artist-1", medium: "Painting") { id } }`,
        { marketPriceInsightsLoader }
      )

      expect(marketPriceInsights).toBeNull()
    })

    it("keeps null BigInts null", async () => {
      const marketPriceInsightsLoader = jest.fn().mockResolvedValue({
        data: priceInsight({ annual_value_sold_cents: null }),
      })

      const {
        marketPriceInsights,
      } = await runQuery(
        `{ marketPriceInsights(artistId: "artist-1", medium: "Painting") { annualValueSoldCents } }`,
        { marketPriceInsightsLoader }
      )

      expect(marketPriceInsights.annualValueSoldCents).toBeNull()
    })
  })

  describe("priceInsights", () => {
    const insights = ["1", "2", "3"].map((id) =>
      priceInsight({ id, medium: `Medium ${id}` })
    )

    it("passes the sort through and returns every insight by default", async () => {
      const priceInsightsLoader = jest
        .fn()
        .mockResolvedValue({ data: insights })

      const { priceInsights } = await runQuery(
        `{
          priceInsights(artistId: "artist-1", sort: DEMAND_RANK_DESC) {
            totalCount
            totalPages
            pageCursors { around { page } }
            pageInfo { hasNextPage }
            nodes { id medium }
            edges { node { id } }
          }
        }`,
        { priceInsightsLoader }
      )

      expect(priceInsightsLoader).toHaveBeenCalledWith({
        artist_id: "artist-1",
        sort: "DEMAND_RANK_DESC",
      })
      expect(priceInsights).toEqual({
        totalCount: 3,
        totalPages: 1,
        pageCursors: null,
        pageInfo: { hasNextPage: false },
        nodes: [
          { id: "1", medium: "Medium 1" },
          { id: "2", medium: "Medium 2" },
          { id: "3", medium: "Medium 3" },
        ],
        edges: [
          { node: { id: "1" } },
          { node: { id: "2" } },
          { node: { id: "3" } },
        ],
      })
    })

    it("omits the sort when none is given", async () => {
      const priceInsightsLoader = jest.fn().mockResolvedValue({ data: [] })

      const {
        priceInsights,
      } = await runQuery(
        `{ priceInsights(artistId: "artist-1") { totalCount totalPages } }`,
        { priceInsightsLoader }
      )

      expect(priceInsightsLoader).toHaveBeenCalledWith({
        artist_id: "artist-1",
      })
      expect(priceInsights).toEqual({ totalCount: 0, totalPages: 0 })
    })

    it("returns an empty connection when Vortex returns no list", async () => {
      const priceInsightsLoader = jest.fn().mockResolvedValue({ data: null })

      const {
        priceInsights,
      } = await runQuery(
        `{ priceInsights(artistId: "artist-1") { totalCount nodes { id } } }`,
        { priceInsightsLoader }
      )

      expect(priceInsights).toEqual({ totalCount: 0, nodes: [] })
    })

    it("paginates in memory", async () => {
      const priceInsightsLoader = jest
        .fn()
        .mockResolvedValue({ data: insights })

      const { priceInsights } = await runQuery(
        `{
          priceInsights(artistId: "artist-1", first: 2) {
            totalPages
            pageCursors { around { page isCurrent } }
            pageInfo { hasNextPage }
            nodes { id }
          }
        }`,
        { priceInsightsLoader }
      )

      expect(priceInsights).toEqual({
        totalPages: 2,
        pageCursors: {
          around: [
            { page: 1, isCurrent: true },
            { page: 2, isCurrent: false },
          ],
        },
        pageInfo: { hasNextPage: true },
        nodes: [{ id: "1" }, { id: "2" }],
      })
    })
  })

  describe("analyticsCalendarYearMarketPriceInsights", () => {
    it("passes the year range and returns BigInts as strings", async () => {
      const calendarYearMarketPriceInsightsLoader = jest
        .fn()
        .mockResolvedValue({
          data: [
            { id: "7", year: "2020", lots_sold: 4, median_sale_price: 100 },
          ],
        })

      const { analyticsCalendarYearMarketPriceInsights } = await runQuery(
        `{
          analyticsCalendarYearMarketPriceInsights(artistId: "artist-1", medium: "Painting", startYear: "2018", endYear: "2026") {
            id
            year
            lotsSold
            medianSalePrice
          }
        }`,
        { calendarYearMarketPriceInsightsLoader }
      )

      expect(calendarYearMarketPriceInsightsLoader).toHaveBeenCalledWith({
        artist_id: "artist-1",
        medium: "Painting",
        start_year: "2018",
        end_year: "2026",
      })
      expect(analyticsCalendarYearMarketPriceInsights).toEqual([
        { id: "7", year: "2020", lotsSold: "4", medianSalePrice: "100" },
      ])
    })

    it("drops blank years, which Vortex rejects", async () => {
      const calendarYearMarketPriceInsightsLoader = jest
        .fn()
        .mockResolvedValue({ data: [] })

      await runQuery(
        `{
          analyticsCalendarYearMarketPriceInsights(artistId: "artist-1", medium: "Painting", startYear: "", endYear: "") {
            id
          }
        }`,
        { calendarYearMarketPriceInsightsLoader }
      )

      expect(calendarYearMarketPriceInsightsLoader).toHaveBeenCalledWith({
        artist_id: "artist-1",
        medium: "Painting",
      })
    })
  })

  describe("analyticsCalendarYearPriceInsights", () => {
    it("returns the insights grouped by medium", async () => {
      const calendarYearPriceInsightsLoader = jest.fn().mockResolvedValue({
        data: [
          {
            medium: "Painting",
            calendar_year_market_price_insights: [
              { id: "7", year: "2020", average_sale_price: 250 },
            ],
          },
        ],
      })

      const { analyticsCalendarYearPriceInsights } = await runQuery(
        `{
          analyticsCalendarYearPriceInsights(artistId: "artist-1", startYear: "2020") {
            medium
            calendarYearMarketPriceInsights { id year averageSalePrice }
          }
        }`,
        { calendarYearPriceInsightsLoader }
      )

      expect(calendarYearPriceInsightsLoader).toHaveBeenCalledWith({
        artist_id: "artist-1",
        start_year: "2020",
      })
      expect(analyticsCalendarYearPriceInsights).toEqual([
        {
          medium: "Painting",
          calendarYearMarketPriceInsights: [
            { id: "7", year: "2020", averageSalePrice: "250" },
          ],
        },
      ])
    })
  })

  describe("analyticsArtistSparklines", () => {
    it("returns the last n sparklines", async () => {
      const artistSparklinesLoader = jest.fn().mockResolvedValue({
        data: ["2023", "2024", "2025"].map((year) => ({
          artist_id: "artist-1",
          year,
          sparkles: 3,
          event_digest: `digest ${year}`,
        })),
      })

      const { analyticsArtistSparklines } = await runQuery(
        `{
          analyticsArtistSparklines(artistId: "artist-1", last: 2) {
            edges { node { year sparkles eventDigest } }
          }
        }`,
        { artistSparklinesLoader }
      )

      expect(artistSparklinesLoader).toHaveBeenCalledWith({
        artist_id: "artist-1",
      })
      expect(analyticsArtistSparklines.edges).toEqual([
        { node: { year: "2024", sparkles: "3", eventDigest: "digest 2024" } },
        { node: { year: "2025", sparkles: "3", eventDigest: "digest 2025" } },
      ])
    })
  })

  describe("analyticsLastUpdatedAt", () => {
    it("returns the last warehouse load time", async () => {
      const warehouseMetadataLoader = jest.fn().mockResolvedValue({
        data: { last_updated_at: "2026-10-15T06:30:00Z" },
      })

      const { analyticsLastUpdatedAt } = await runQuery(
        `{ analyticsLastUpdatedAt }`,
        {
          warehouseMetadataLoader,
        }
      )

      expect(analyticsLastUpdatedAt).toEqual("2026-10-15T06:30:00Z")
    })
  })
})
