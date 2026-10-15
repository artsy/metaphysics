import type { GraphQLObjectType, GraphQLSchema } from "graphql"

const loadWithFlag = (useUnstitchedVortex: boolean) => {
  let mergedSchema: GraphQLSchema | undefined
  let metaphysicsService: Record<string, unknown> | undefined

  jest.isolateModules(() => {
    const actualConfig = jest.requireActual("config").default
    jest.doMock("config", () => ({
      __esModule: true,
      default: { ...actualConfig, USE_UNSTITCHED_VORTEX: useUnstitchedVortex },
    }))

    const localSchema = require("schema/v2/schema").default
    const { incrementalMergeSchemas } = require("lib/stitching/mergeSchemas")
    mergedSchema = incrementalMergeSchemas(localSchema)
    metaphysicsService = require("schema/v2/system/services/metaphysics").default.resolve()
  })

  return {
    mergedSchema: mergedSchema as GraphQLSchema,
    metaphysicsService: metaphysicsService as Record<string, unknown>,
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
    const { mergedSchema, metaphysicsService } = loadWithFlag(true)

    it("does not stitch the Vortex subschema", () => {
      expect(mergedSchema.getType("AnalyticsPricingContext")).toBeUndefined()
      expect(rootFieldNames(mergedSchema)).not.toContain(
        "analyticsLastUpdatedAt"
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
