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
