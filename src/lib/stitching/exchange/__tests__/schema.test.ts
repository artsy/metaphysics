import { executableExchangeSchema, transformsForExchange } from "../schema"
import {
  getTypesFromSchema,
  getRootFieldsFromSchema,
  getMutationFieldsFromSchema,
} from "lib/stitching/lib/getTypesFromSchema"
import { printSchema } from "graphql"

it("Does not include generic type names", async () => {
  const exchangeSchema = await executableExchangeSchema(transformsForExchange)
  const exchangeTypes = await getTypesFromSchema(exchangeSchema)

  expect(exchangeTypes).not.toContain("Order")
  expect(exchangeTypes).not.toContain("LineItem")
  expect(exchangeTypes).not.toContain("DateTime")

  expect(exchangeTypes).toContain("CommerceOrder")
})

it("has all our root fields", async () => {
  const exchangeSchema = await executableExchangeSchema(transformsForExchange)
  const rootFields = await getRootFieldsFromSchema(exchangeSchema)

  expect(rootFields).not.toContain("order")
  expect(rootFields).toContain("commerceOrder")
})

it("Includes prefixed mutations", async () => {
  const exchangeSchema = await executableExchangeSchema(transformsForExchange)
  const mutations = await getMutationFieldsFromSchema(exchangeSchema)

  expect(mutations).toContain("commerceCreateOrderWithArtwork")
  expect(mutations).toContain("commerceApproveOrder")
})

it("creates an SDL", async () => {
  const exchangeSchema = await executableExchangeSchema(transformsForExchange)
  expect(
    printSchema(exchangeSchema, { commentDescriptions: true })
  ).toMatchSnapshot()
})
