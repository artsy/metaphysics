import { getKawsMergedSchema } from "lib/stitching/kaws/__tests__/testingUtils"
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
})
