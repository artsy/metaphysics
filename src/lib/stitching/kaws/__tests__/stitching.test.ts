import {
  getKawsMergedSchema,
  getKawsStitchedSchema,
} from "lib/stitching/kaws/__tests__/testingUtils"
import { getFieldsForTypeFromSchema } from "lib/stitching/lib/getTypesFromSchema"

describe("KAWS Stitching", () => {
  it("extends the Viewer object", async () => {
    const mergedSchema = await getKawsMergedSchema()
    const viewerFields = await getFieldsForTypeFromSchema(
      "Viewer",
      mergedSchema
    )
    expect(viewerFields).toContain("marketingCollections")
  })

  describe("HomePageMarketingCollectionsModule", () => {
    it("extends the HomePageMarketingCollectionsModule object", async () => {
      const mergedSchema = await getKawsMergedSchema()
      const homePageMarketingCollectionsModuleFields = await getFieldsForTypeFromSchema(
        "HomePageMarketingCollectionsModule",
        mergedSchema
      )
      expect(homePageMarketingCollectionsModuleFields).toContain("results")
    })

    it("returns an array even if the kaws request fails", async () => {
      const { resolvers } = await getKawsStitchedSchema()
      const resultsResolver =
        resolvers.HomePageMarketingCollectionsModule.results.resolve
      const delegateToSchemaMock = jest.fn()
      delegateToSchemaMock.mockRejectedValue(
        "simulating a kaws request failure"
      )
      const mergeInfo = { delegateToSchema: delegateToSchemaMock }
      const results = await resultsResolver({}, {}, {}, { mergeInfo })
      expect(results).toEqual([])
    })
  })

  describe("marketingCollections", () => {
    it("passes artist internalID to kaws' artistID arg when querying `... on Artist`", async () => {
      const { resolvers } = await getKawsStitchedSchema()
      const marketingCollectionsResolver =
        resolvers.Artist.marketingCollections.resolve
      const mergeInfo = { delegateToSchema: jest.fn() }

      await marketingCollectionsResolver(
        { internalID: "artist-internal-id" },
        {},
        {},
        { mergeInfo }
      )

      expect(mergeInfo.delegateToSchema).toHaveBeenCalledWith(
        expect.objectContaining({
          args: { artistID: "artist-internal-id" },
          fieldName: "marketingCollections",
        })
      )
    })

    it("passes through slugs when stitched under a fair", async () => {
      const { resolvers } = await getKawsStitchedSchema()
      const marketingCollectionsResolver =
        resolvers.Fair.marketingCollections.resolve
      const mergeInfo = { delegateToSchema: jest.fn() }

      await marketingCollectionsResolver(
        { kawsCollectionSlugs: ["catty-collection"] },
        {},
        {},
        { mergeInfo }
      )

      expect(mergeInfo.delegateToSchema).toHaveBeenCalledWith(
        expect.objectContaining({
          args: { slugs: ["catty-collection"] },
          fieldName: "marketingCollections",
        })
      )
    })

    it("returns an empty list when there are no kawsCollectionSlugs", async () => {
      const { resolvers } = await getKawsStitchedSchema()
      const marketingCollectionsResolver =
        resolvers.Fair.marketingCollections.resolve
      const mergeInfo = { delegateToSchema: jest.fn() }

      const result = await marketingCollectionsResolver(
        { kawsCollectionSlugs: [] },
        {},
        {},
        { mergeInfo }
      )

      expect(result).toEqual([])
    })
  })
})
