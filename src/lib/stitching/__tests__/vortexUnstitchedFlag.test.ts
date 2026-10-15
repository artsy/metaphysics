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
      const partner = mergedSchema.getType("Partner") as GraphQLObjectType
      expect(artwork.getFields().pricingContext).toBeUndefined()
      expect(partner.getFields().analytics).toBeUndefined()
    })

    it("still stitches the other services", () => {
      expect(rootFieldNames(mergedSchema)).toContain("commerceOrder")
    })

    it("reports stitchingVortex as false", () => {
      expect(metaphysicsService.stitchingVortex).toBe(false)
    })
  })
})
