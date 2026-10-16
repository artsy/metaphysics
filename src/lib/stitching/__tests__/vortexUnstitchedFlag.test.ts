import type { GraphQLObjectType, GraphQLSchema } from "graphql"

const loadWithFlag = (useUnstitchedVortex: boolean) => {
  let mergedSchema: GraphQLSchema | undefined
  let metaphysicsService: Record<string, unknown> | undefined
  // From the same module registry as the schema, or graphql-js rejects it.
  let graphql: typeof import("graphql").graphql | undefined

  jest.isolateModules(() => {
    const actualConfig = jest.requireActual("config").default
    jest.doMock("config", () => ({
      __esModule: true,
      default: { ...actualConfig, USE_UNSTITCHED_VORTEX: useUnstitchedVortex },
    }))

    graphql = require("graphql").graphql
    const localSchema = require("schema/v2/schema").default
    const { incrementalMergeSchemas } = require("lib/stitching/mergeSchemas")
    mergedSchema = incrementalMergeSchemas(localSchema)
    metaphysicsService = require("schema/v2/system/services/metaphysics").default.resolve()
  })

  return {
    mergedSchema: mergedSchema as GraphQLSchema,
    metaphysicsService: metaphysicsService as Record<string, unknown>,
    graphql: graphql as typeof import("graphql").graphql,
  }
}

const rootFieldNames = (schema: GraphQLSchema) =>
  Object.keys((schema.getQueryType() as GraphQLObjectType).getFields())

describe("USE_UNSTITCHED_VORTEX", () => {
  afterEach(() => {
    jest.dontMock("config")
  })

  describe("when false (default)", () => {
    const { mergedSchema, metaphysicsService } = loadWithFlag(false)

    it("stitches the Vortex subschema", () => {
      expect(mergedSchema.getType("AnalyticsPricingContext")).toBeDefined()
      expect(rootFieldNames(mergedSchema)).toContain("analyticsLastUpdatedAt")
    })

    it("adds the Vortex stitching extensions", () => {
      const artwork = mergedSchema.getType("Artwork") as GraphQLObjectType
      const partner = mergedSchema.getType("Partner") as GraphQLObjectType
      expect(artwork.getFields().pricingContext).toBeDefined()
      expect(partner.getFields().analytics).toBeDefined()
    })

    it("filters root fields only reachable through stitching", () => {
      const roots = rootFieldNames(mergedSchema)
      expect(roots).not.toContain("analyticsPartnerStats")
      expect(roots).not.toContain("analyticsUserStats")
      expect(roots).not.toContain("analyticsArtworkRecommendations")
      expect(mergedSchema.getType("AnalyticsArtworkRecommendation")).toBe(
        undefined
      )
    })

    it("reports stitchingVortex as true", () => {
      expect(metaphysicsService.stitchingVortex).toBe(true)
    })
  })

  describe("when true", () => {
    const { mergedSchema, metaphysicsService, graphql } = loadWithFlag(true)

    it("does not stitch the Vortex subschema", () => {
      expect(mergedSchema.getType("AnalyticsPricingContext")).toBeUndefined()
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

    it("mounts every price insight root field", () => {
      expect(rootFieldNames(mergedSchema)).toEqual(
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

    it("does not add the Vortex stitching extensions", () => {
      const artwork = mergedSchema.getType("Artwork") as GraphQLObjectType
      expect(artwork.getFields().pricingContext).toBeUndefined()
    })

    it("serves Partner.analytics and User.analytics natively", async () => {
      const partner = mergedSchema.getType("Partner") as GraphQLObjectType
      const user = mergedSchema.getType("User") as GraphQLObjectType
      expect(partner.getFields().analytics.type.toString()).toEqual(
        "AnalyticsPartnerStats"
      )
      expect(user.getFields().analytics.type.toString()).toEqual(
        "AnalyticsUserStats"
      )

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
      expect(vortexPartnerStatsLoader).toHaveBeenCalledWith({
        partnerId: "5748d153cd530e2d5100031c",
        section: "sales",
        period: "FOUR_WEEKS",
      })
      expect(vortexUserStatsLoader).toHaveBeenCalledWith({ user_id: "user-1" })
    })

    it("still stitches the other services", () => {
      expect(rootFieldNames(mergedSchema)).toContain("commerceOrder")
    })

    it("reports stitchingVortex as false", () => {
      expect(metaphysicsService.stitchingVortex).toBe(false)
    })
  })
})
