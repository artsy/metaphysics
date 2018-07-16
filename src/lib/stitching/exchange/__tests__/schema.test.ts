import { executableExchangeSchema } from "../schema"
import { getTypesFromSchema } from "lib/stitching/lib/getTypesFromSchema"

it("Does not include generic type names", async () => {
  const exchangeSchema = await executableExchangeSchema()
  const exchangeTypes = await getTypesFromSchema(exchangeSchema)

  expect(exchangeTypes).not.toContain("Order")
  expect(exchangeTypes).not.toContain("LineItem")
  expect(exchangeTypes).not.toContain("DateTime")

  expect(exchangeTypes).toContain("EcommerceOrder")
})
