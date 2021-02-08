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
    const fieldsWithCents = orderableFields.filter((f) => f.endsWith("Cents"))
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

it("extends the Mutation object", async () => {
  const mergedSchema = await getExchangeMergedSchema()
  const meFields = await getFieldsForTypeFromSchema("Mutation", mergedSchema)
  expect(meFields).toContain("createInquiryOfferOrder")
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
      operation: "query",
      schema: expect.anything(),
      context: expect.anything(),
      info: expect.anything(),
    })
  })

  it("calls a user or partner when looking up party details", async () => {
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
    schema: expect.anything(),
    context: expect.anything(),
    info: expect.anything(),
  })
})

it("delegates to the local schema for an Order's creditCard", async () => {
  const { resolvers } = await getExchangeStitchedSchema()
  const creditCardResolver = resolvers.CommerceBuyOrder.creditCard.resolve
  const mergeInfo = { delegateToSchema: jest.fn() }

  creditCardResolver({ creditCardId: "CC-1" }, {}, {}, { mergeInfo })

  expect(mergeInfo.delegateToSchema).toHaveBeenCalledWith({
    args: { id: "CC-1" },
    fieldName: "creditCard",
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
    fieldName: "creditCard",
    ...restOfResolveArgs,
  })
})

describe("createInquiryOfferOrder", () => {
  const context = {
    conversationLoader: jest.fn(),
    conversationCreateConversationOrderLoader: jest.fn(),
  }
  const mergeInfo = { delegateToSchema: jest.fn() }

  beforeEach(() => {
    jest.resetAllMocks()
  })

  it("calls impulse after creating the order", async () => {
    const { resolvers } = await getExchangeStitchedSchema()
    const resolver = resolvers.Mutation.createInquiryOfferOrder.resolve

    const args = {
      input: {
        artworkId: "artwork-id",
        impulseConversationId: "conversation-id",
      },
    }
    const orderResult = { orderOrError: { order: { internalID: "order-id" } } }
    context.conversationLoader.mockResolvedValue({})
    mergeInfo.delegateToSchema.mockResolvedValue(orderResult)
    context.conversationCreateConversationOrderLoader.mockResolvedValue({
      conversation_id: "it worked",
    })

    const result = await resolver({}, args, context, { mergeInfo })

    expect(mergeInfo.delegateToSchema).toHaveBeenCalledWith({
      args,
      fieldName: "commerceCreateInquiryOfferOrderWithArtwork",
      operation: "mutation",
      schema: expect.anything(),
      context: expect.anything(),
      info: expect.anything(),
      transforms: [expect.anything()],
    })
    expect(result).toEqual(orderResult)
    expect(context.conversationLoader).toHaveBeenCalledWith("conversation-id")
    expect(
      context.conversationCreateConversationOrderLoader
    ).toHaveBeenCalledWith({
      conversation_id: "conversation-id",
      exchange_order_id: "order-id",
    })
  })

  it("returns an error from exchange", async () => {
    const { resolvers } = await getExchangeStitchedSchema()
    const resolver = resolvers.Mutation.createInquiryOfferOrder.resolve
    const args = {
      input: {
        artworkId: "artwork-id",
        impulseConversationId: "conversation-id",
      },
    }
    const orderResult = { orderOrError: { error: { message: "who cares" } } }

    context.conversationLoader.mockResolvedValue({})
    mergeInfo.delegateToSchema.mockResolvedValue(orderResult)
    const result = await resolver({}, args, context, { mergeInfo })

    expect(result).toEqual(orderResult)
    expect(
      context.conversationCreateConversationOrderLoader
    ).not.toHaveBeenCalled()
  })

  it("returns an error if the conversationLoader does not return a conversation", async () => {
    const { resolvers } = await getExchangeStitchedSchema()
    const resolver = resolvers.Mutation.createInquiryOfferOrder.resolve
    const args = {
      input: {
        artworkId: "artwork-id",
        impulseConversationId: "conversation-id",
      },
    }

    context.conversationLoader.mockRejectedValue({})

    await expect(resolver({}, args, context, { mergeInfo })).rejects.toThrow(
      "[metaphysics @ exchange/v2/stitching] Conversation not found"
    )
  })
  it("returns an error if the conversationCreateConversationOrderLoader fails", async () => {
    const { resolvers } = await getExchangeStitchedSchema()
    const resolver = resolvers.Mutation.createInquiryOfferOrder.resolve
    const args = {
      input: {
        artworkId: "artwork-id",
        impulseConversationId: "conversation-id",
      },
    }
    const orderResult = { orderOrError: { order: { internalID: "order-id" } } }

    context.conversationLoader.mockResolvedValue({})
    mergeInfo.delegateToSchema.mockResolvedValue(orderResult)
    context.conversationCreateConversationOrderLoader.mockRejectedValue({
      message: "bad stuff",
    })

    await expect(resolver({}, args, context, { mergeInfo })).rejects.toThrow(
      "Impulse: request to associate offer with conversation failed"
    )
  })
})
