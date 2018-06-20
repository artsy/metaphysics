import { executableStressSchema } from "../schema"
import { getTypesFromSchema } from "lib/stitching/lib/getTypesFromSchema"

it("Does not include generic type names", async () => {
  const stressSchema = await executableStressSchema()
  const stressTypes = await getTypesFromSchema(stressSchema)

  expect(stressTypes).not.toContain("Order")
  expect(stressTypes).not.toContain("LineItem")
  expect(stressTypes).not.toContain("DateTime")

  expect(stressTypes).toContain("EcommerceOrder")
})
