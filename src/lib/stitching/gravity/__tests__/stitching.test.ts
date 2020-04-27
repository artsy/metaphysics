import { getFieldsForTypeFromSchema } from "lib/stitching/lib/getTypesFromSchema"
import {
  getGravityMergedSchema,
  getGravityStitchedSchema,
} from "./testingUtils"

it("extends the ViewingRoom type with an artworksConnection field", async () => {
  const mergedSchema = await getGravityMergedSchema()
  const artworkConnectionFields = await getFieldsForTypeFromSchema(
    "ViewingRoom",
    mergedSchema
  )

  expect(artworkConnectionFields).toContain("artworksConnection")
})

it("extends the ViewingRoom type with a partner field", async () => {
  const mergedSchema = await getGravityMergedSchema()
  const artworkConnectionFields = await getFieldsForTypeFromSchema(
    "ViewingRoom",
    mergedSchema
  )

  expect(artworkConnectionFields).toContain("partner")
})

it("resolves the artworks field on ViewingRoom as a paginated list", async () => {
  const { resolvers } = await getGravityStitchedSchema()
  const { artworksConnection } = resolvers.ViewingRoom
  const info = { mergeInfo: { delegateToSchema: jest.fn() } }

  artworksConnection.resolve(
    { artworkIDs: ["1", "2", "3"] },
    { first: 2 },
    {},
    info
  )

  expect(info.mergeInfo.delegateToSchema).toHaveBeenCalledWith({
    args: { ids: ["1", "2", "3"], first: 2 },
    operation: "query",
    fieldName: "artworks",
    schema: expect.anything(),
    context: expect.anything(),
    info: expect.anything(),
  })
})

it("resolves the partner field on ViewingRoom", async () => {
  const { resolvers } = await getGravityStitchedSchema()
  const { partner } = resolvers.ViewingRoom
  const info = { mergeInfo: { delegateToSchema: jest.fn() } }

  partner.resolve({ partnerID: "fakeid" }, {}, {}, info)

  expect(info.mergeInfo.delegateToSchema).toHaveBeenCalledWith({
    args: { id: "fakeid" },
    operation: "query",
    fieldName: "partner",
    schema: expect.anything(),
    context: expect.anything(),
    info: expect.anything(),
  })
})
