import type { GraphQLObjectType, GraphQLSchema } from "graphql"

// Top-level imports of these leave a union with an undefined member (a circular
// import), so the schema is loaded in its own module registry instead.
const loadMergedSchema = () => {
  let mergedSchema: GraphQLSchema | undefined
  // From the same module registry as the schema, or graphql-js rejects it.
  let graphql: typeof import("graphql").graphql | undefined

  jest.isolateModules(() => {
    graphql = require("graphql").graphql
    const localSchema = require("schema/v2/schema").default
    const { incrementalMergeSchemas } = require("lib/stitching/mergeSchemas")
    mergedSchema = incrementalMergeSchemas(localSchema)
  })

  return {
    mergedSchema: mergedSchema as GraphQLSchema,
    graphql: graphql as typeof import("graphql").graphql,
  }
}

// The Vortex fields used to come from its stitched schema. These check that the
// merged schema serves them natively, and that no other subschema does.
describe("Vortex fields in the merged schema", () => {
  const { mergedSchema, graphql } = loadMergedSchema()

  const rootFieldNames = () =>
    Object.keys((mergedSchema.getQueryType() as GraphQLObjectType).getFields())

  it("doesn't bring back types only the stitched Vortex schema had", () => {
    for (const type of [
      "AnalyticsArtistAffinity",
      "AnalyticsArtistIdMediumTupleType",
      "AnalyticsArtistRecommendation",
      "AnalyticsArtworkRecommendation",
      "AnalyticsNewForYouRecommendation",
      "MarketPriceInsightsConnection",
    ]) {
      expect(mergedSchema.getType(type)).toBeUndefined()
    }
  })

  it("mounts every price insight root field", () => {
    expect(rootFieldNames()).toEqual(
      expect.arrayContaining([
        "analyticsArtistSparklines",
        "analyticsCalendarYearMarketPriceInsights",
        "analyticsCalendarYearPriceInsights",
        "analyticsLastUpdatedAt",
        "marketPriceInsights",
        "priceInsights",
      ])
    )
  })

  it("serves price insights from the native fields", async () => {
    const marketPriceInsightsLoader = jest
      .fn()
      .mockResolvedValue({ data: { id: "1" } })
    const priceInsightsLoader = jest
      .fn()
      .mockResolvedValue({ data: [{ id: "1" }] })

    // Diffusion's schema also declares these root fields, so this would
    // reach Diffusion if they weren't filtered out of it.
    const result = await graphql({
      schema: mergedSchema,
      source: `{
        marketPriceInsights(artistId: "artist-1", medium: "Painting") { id }
        priceInsights(artistId: "artist-1") { totalCount }
      }`,
      contextValue: {
        requestIDs: {},
        unauthenticatedLoaders: {
          marketPriceInsightsLoader,
          priceInsightsLoader,
        },
      },
    })

    expect(result).toEqual({
      data: {
        marketPriceInsights: { id: "1" },
        priceInsights: { totalCount: 1 },
      },
    })
  })

  it("serves Artwork.pricingContext natively", async () => {
    const artwork = mergedSchema.getType("Artwork") as GraphQLObjectType
    expect(artwork.getFields().pricingContext.type.toString()).toEqual(
      "AnalyticsPricingContext"
    )

    const pricingContextLoader = jest.fn().mockResolvedValue({
      data: {
        applied_filters: { category: "PAINTING", dimension: "SMALL" },
        bins: [{ min_price_cents: 0, max_price_cents: 4500, num_artworks: 1 }],
      },
    })

    const result = await graphql({
      schema: mergedSchema,
      source: `{
        artwork(id: "artwork-1") {
          pricingContext {
            appliedFiltersDisplay
            bins { maxPrice numArtworks }
          }
        }
      }`,
      contextValue: {
        requestIDs: {},
        artworkLoader: jest.fn().mockResolvedValue({
          artist: { id: "artist-slug" },
          artists: [{ _id: "artist-id", name: "Good Artist" }],
          category: "Painting",
          size_score: 224.6,
          forsale: true,
          price_currency: "USD",
          price_cents: [234],
        }),
        artistLoader: jest.fn().mockResolvedValue({ _id: "artist-id" }),
        unauthenticatedLoaders: { pricingContextLoader },
      },
    })

    expect(result).toEqual({
      data: {
        artwork: {
          pricingContext: {
            appliedFiltersDisplay:
              "Price ranges of small paintings by Good Artist",
            bins: [{ maxPrice: "$45", numArtworks: 1 }],
          },
        },
      },
    })
  })

  it("serves Partner.analytics and User.analytics natively", async () => {
    const vortexPartnerStatsLoader = jest
      .fn()
      .mockResolvedValue({ total_cents: 100 })
    const vortexUserStatsLoader = jest.fn().mockResolvedValue({
      data: { user_id: "user-1", total_purchase_count: 2 },
    })

    const result = await graphql({
      schema: mergedSchema,
      source: `{
        partner(id: "5748d153cd530e2d5100031c") {
          analytics { sales(period: FOUR_WEEKS) { totalCents } }
        }
        user(id: "user-1") {
          analytics { totalPurchaseCount }
        }
      }`,
      contextValue: {
        requestIDs: {},
        userByIDLoader: jest.fn().mockResolvedValue({ id: "user-1" }),
        authenticatedLoaders: {
          vortexPartnerStatsLoader,
          vortexUserStatsLoader,
        },
        unauthenticatedLoaders: {},
      },
    })

    expect(result).toEqual({
      data: {
        partner: { analytics: { sales: { totalCents: 100 } } },
        user: { analytics: { totalPurchaseCount: 2 } },
      },
    })
  })

  it("still stitches the other services", () => {
    expect(rootFieldNames()).toContain("commerceOrder")
  })
})
