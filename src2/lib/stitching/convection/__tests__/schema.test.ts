import { executableConvectionSchema } from "../schema"
import { getTypesFromSchema } from "lib/stitching/lib/getTypesFromSchema"

it("Does not include allowlisted types", async () => {
  const convectionSchema = await executableConvectionSchema()
  const convectionTypes = await getTypesFromSchema(convectionSchema)

  expect(convectionTypes).not.toContain("Submission")
  expect(convectionTypes).not.toContain("Asset")
  expect(convectionTypes).not.toContain("State")
  expect(convectionTypes).not.toContain("Category")
})
