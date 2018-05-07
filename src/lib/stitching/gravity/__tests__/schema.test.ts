import { executableGravitySchema } from "../schema"
import { getTypesFromSchema } from "lib/stitching/lib/getTypesFromSchema"

it("Does not include blacklisted types", async () => {
  const gravitySchema = await executableGravitySchema()
  const gravityTypes = await getTypesFromSchema(gravitySchema)

  expect(gravityTypes).not.toContain("Artist")
  expect(gravityTypes).not.toContain("Artwork")
  expect(gravityTypes).not.toContain("Partner")
})
