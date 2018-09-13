import { executableExchangeSchema } from "../schema"
import {
  getTypesFromSchema,
  getRootFieldsFromSchema,
} from "lib/stitching/lib/getTypesFromSchema"
import { printSchema } from "graphql"

it("Does not include generic type names", async () => {
  const exchangeSchema = await executableExchangeSchema()
  const exchangeTypes = await getTypesFromSchema(exchangeSchema)

  expect(exchangeTypes).not.toContain("Order")
  expect(exchangeTypes).not.toContain("LineItem")
  expect(exchangeTypes).not.toContain("DateTime")

  expect(exchangeTypes).toContain("EcommerceOrder")
})

it("has all our root fields", async () => {
  const exchangeSchema = await executableExchangeSchema()
  const rootFields = await getRootFieldsFromSchema(exchangeSchema)

  expect(rootFields).not.toContain("order")
  expect(rootFields).toContain("ecommerceOrder")
})

it("creates an SDL", async () => {
  const exchangeSchema = await executableExchangeSchema()
  expect(
    printSchema(exchangeSchema, { commentDescriptions: true })
  ).toMatchSnapshot()
})
