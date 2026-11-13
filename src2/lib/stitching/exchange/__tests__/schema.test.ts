import {
  getTypesFromSchema,
  getRootFieldsFromSchema,
  getMutationFieldsFromSchema,
} from "lib/stitching/lib/getTypesFromSchema"
import { getExchangeTransformedSchema } from "./testingUtils"

it("does not include generic type names", async () => {
  const exchangeSchema = await getExchangeTransformedSchema()
  const exchangeTypes = await getTypesFromSchema(exchangeSchema)

  expect(exchangeTypes).not.toContain("LineItem")
  expect(exchangeTypes).not.toContain("DateTime")

  expect(exchangeTypes).not.toContain("Order")
  expect(exchangeTypes).toContain("CommerceOrder")
})

it("has all our root fields", async () => {
  const exchangeSchema = await getExchangeTransformedSchema()
  const rootFields = await getRootFieldsFromSchema(exchangeSchema)

  expect(rootFields).not.toContain("order")
  expect(rootFields).toContain("commerceOrder")
})

it("includes prefixed mutations", async () => {
  const exchangeSchema = await getExchangeTransformedSchema()
  const mutations = await getMutationFieldsFromSchema(exchangeSchema)

  expect(mutations).toContain("commerceCreateOrderWithArtwork")
  expect(mutations).toContain("commerceApproveOrder")
})
