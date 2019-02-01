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

it("makes exceptions for types used in Eigen's queries", async () => {
  // We want to make sure that old Eigen queries don't break
  //
  // See: https://github.com/artsy/eigen/blob/master/Artsy/Networking/create_offer.graphql
  // and: https://github.com/artsy/eigen/blob/master/Artsy/Networking/create_order.graphql
  //
  const exchangeSchema = await getExchangeTransformedSchema()

  const exchangeTypes = await getTypesFromSchema(exchangeSchema)
  const mutationFields = await getMutationFieldsFromSchema(exchangeSchema)

  expect(exchangeTypes).toContain("OrderWithMutationSuccess")
  expect(exchangeTypes).toContain("OrderWithMutationFailure")
  expect(exchangeTypes).toContain("CreateOrderWithArtworkInput")
  expect(exchangeTypes).toContain("OrderWithMutationSuccess")

  // What we want
  // expect(mutationFields).toContain("ecommerceCreateOrderWithArtwork")
  // expect(mutationFields).toContain("ecommerceCreateOfferOrderWithArtwork")

  // What we have
  expect(mutationFields).toContain("commerceCreateOrderWithArtwork")
  expect(mutationFields).toContain("commerceCreateOfferOrderWithArtwork")
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
