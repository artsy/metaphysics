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

    it("passes through slugs to kaws when querying HomePageMarketingCollectionsModule.results", async () => {
      const { resolvers } = await getKawsStitchedSchema()
      const resultsResolver =
        resolvers.HomePageMarketingCollectionsModule.results.resolve
      const mergeInfo = { delegateToSchema: jest.fn() }
      resultsResolver({}, {}, {}, { mergeInfo })

      expect(mergeInfo.delegateToSchema).toHaveBeenCalledWith(
        expect.objectContaining({
          args: {
            slugs: [
              "new-this-week",
              "auction-highlights",
              "trending-emerging-artists",
            ],
          },
        })
      )
    })
  })

  describe("marketingCollections", () => {
    it("passes artist internalID to kaws' artistID arg when querying `... on Artist`", async () => {
      const { resolvers } = await getKawsStitchedSchema()
      const marketingCollectionsResolver =
        resolvers.Artist.marketingCollections.resolve
      const mergeInfo = { delegateToSchema: jest.fn() }

      marketingCollectionsResolver(
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
  })
})
