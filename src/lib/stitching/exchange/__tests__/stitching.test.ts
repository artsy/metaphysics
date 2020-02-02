import { getFieldsForTypeFromSchema } from "lib/stitching/lib/getTypesFromSchema"
import {
  getExchangeMergedSchema,
  getExchangeStitchedSchema,
} from "./testingUtils"

it("extends the Order objects", async () => {
  const mergedSchema = await getExchangeMergedSchema()

  const orderables = ["CommerceBuyOrder", "CommerceOfferOrder", "CommerceOrder"]
  for (const orderable of orderables) {
    const orderableFields = await getFieldsForTypeFromSchema(
      orderable,
      mergedSchema
    )

    expect(orderableFields).toContain("buyerDetails")
    expect(orderableFields).toContain("sellerDetails")
    expect(orderableFields).toContain("creditCard")

    // Any field inside the CommerceBuyOrder & CommerceOfferOrder which
    // ends in cents should have a version without cents which is a
    // string equivalent
    const fieldsWithCents = orderableFields.filter(f => f.endsWith("Cents"))
    for (const field of fieldsWithCents) {
      expect(orderableFields).toContain(field.replace("Cents", ""))
    }
  }
})

it("extends the Me object", async () => {
  const mergedSchema = await getExchangeMergedSchema()
  const meFields = await getFieldsForTypeFromSchema("Me", mergedSchema)
  expect(meFields).toContain("orders")
})

it("resolves amount fields on CommerceOrder", async () => {
  const { resolvers } = await getExchangeStitchedSchema()
  const totalListPriceResolver = resolvers.CommerceOrder.totalListPrice.resolve

  expect(
    totalListPriceResolver(
      { currencyCode: "USD", totalListPriceCents: 100 },
      {}
    )
  ).toEqual("$1.00")
})

// These are used in all delegate calls, and not useful to the test
const restOfResolveArgs = {
  operation: "query",
  schema: expect.anything(),
  context: expect.anything(),
  transforms: expect.anything(),
  info: expect.anything(),
}

describe("when handling resolver delegation", () => {
  it("requests an artwork from an LineItem's artworkId", async () => {
    const { resolvers } = await getExchangeStitchedSchema()
    const artworkResolver = resolvers.CommerceLineItem.artwork.resolve
    const mergeInfo = { delegateToSchema: jest.fn() }

    artworkResolver({ artworkId: "ARTWORK-ID" }, {}, {}, { mergeInfo })

    expect(mergeInfo.delegateToSchema).toHaveBeenCalledWith({
      args: { id: "ARTWORK-ID" },
      fieldName: "artwork",
      ...restOfResolveArgs,
    })
  })

  it("calls a user or partner when looking up party details ", async () => {
    const { resolvers } = await getExchangeStitchedSchema()
    const { buyerDetails } = resolvers.CommerceBuyOrder
    const info = { mergeInfo: { delegateToSchema: jest.fn() } }

    info.mergeInfo.delegateToSchema.mockResolvedValue({})

    const parentUser = {
      buyerDetails: { __typename: "CommerceUser", id: "USER-ID" },
    }

    buyerDetails.resolve(parentUser, {}, {}, info)

    expect(info.mergeInfo.delegateToSchema).toHaveBeenCalledWith({
      args: { id: "USER-ID" },
      operation: "query",
      fieldName: "user",
      ...restOfResolveArgs,
    })

    // Reset and verify what happens when we get a partner's details
    // back from Exchange
    info.mergeInfo.delegateToSchema.mockReset()
    info.mergeInfo.delegateToSchema.mockResolvedValue({})

    const parentPartner = {
      buyerDetails: { __typename: "CommercePartner", id: "PARTNER-ID" },
    }

    buyerDetails.resolve(parentPartner, {}, {}, info)

    expect(info.mergeInfo.delegateToSchema).toHaveBeenCalledWith({
      args: { id: "PARTNER-ID" },
      operation: "query",
      fieldName: "partner",
      ...restOfResolveArgs,
    })
  })
})

it("delegates to the local schema for an LineItem's artwork", async () => {
  const { resolvers } = await getExchangeStitchedSchema()
  const artworkResolver = resolvers.CommerceLineItem.artwork.resolve
  const mergeInfo = { delegateToSchema: jest.fn() }

  artworkResolver({ artworkId: "ARTWORK-ID" }, {}, {}, { mergeInfo })

  expect(mergeInfo.delegateToSchema).toHaveBeenCalledWith({
    args: { id: "ARTWORK-ID" },
    fieldName: "artwork",
    operation: "query",
    ...restOfResolveArgs,
  })
})

it("delegates to the local schema for an Order's creditCard", async () => {
  const { resolvers } = await getExchangeStitchedSchema()
  const creditCardResolver = resolvers.CommerceBuyOrder.creditCard.resolve
  const mergeInfo = { delegateToSchema: jest.fn() }

  creditCardResolver({ creditCardId: "CC-1" }, {}, {}, { mergeInfo })

  expect(mergeInfo.delegateToSchema).toHaveBeenCalledWith({
    args: { id: "CC-1" },
    fieldName: "credit_card",
    operation: "query",
    ...restOfResolveArgs,
  })
})

it("doesn't delegate to the local schema for an Order's creditCard if creditCardId is null", async () => {
  const { resolvers } = await getExchangeStitchedSchema()
  const creditCardResolver = resolvers.CommerceBuyOrder.creditCard.resolve
  const mergeInfo = { delegateToSchema: jest.fn() }

  creditCardResolver({ creditCardId: null }, {}, {}, { mergeInfo })

  expect(mergeInfo.delegateToSchema).not.toHaveBeenCalledWith({
    args: { id: null },
    fieldName: "credit_card",
    operation: "query",
    ...restOfResolveArgs,
  })
})
