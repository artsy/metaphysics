import { getFieldsForTypeFromSchema } from "lib/stitching/lib/getTypesFromSchema"
import {
  getGravityMergedSchema,
  getGravityStitchedSchema,
} from "./testingUtils"
import moment from "moment"

describe("gravity/stitching", () => {
  describe("#artworksConnection", () => {
    it("extends the ViewingRoom type with an artworksConnection field", async () => {
      const mergedSchema = await getGravityMergedSchema()
      const artworkConnectionFields = await getFieldsForTypeFromSchema(
        "ViewingRoom",
        mergedSchema
      )

      expect(artworkConnectionFields).toContain("artworksConnection")
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

    it("converts empty artworkIDs argument", async () => {
      const { resolvers } = await getGravityStitchedSchema()
      const { artworksConnection } = resolvers.ViewingRoom
      const info = { mergeInfo: { delegateToSchema: jest.fn() } }

      artworksConnection.resolve({ artworkIDs: [] }, { first: 2 }, {}, info)

      expect(info.mergeInfo.delegateToSchema).toHaveBeenCalledWith({
        args: { ids: [null], first: 2 },
        operation: "query",
        fieldName: "artworks",
        schema: expect.anything(),
        context: expect.anything(),
        info: expect.anything(),
      })
    })
  })

  describe("#calculatedEndAt", () => {
    it("extends the ViewingRoom type with a calculatedEndAt field", async () => {
      const mergedSchema = await getGravityMergedSchema()
      const fields = await getFieldsForTypeFromSchema(
        "ViewingRoom",
        mergedSchema
      )

      expect(fields).toContain("calculatedEndAt")
    })

    it("returns null if endAt date is greater than 30 days", async () => {
      const { resolvers } = await getGravityStitchedSchema()
      const { calculatedEndAt } = resolvers.ViewingRoom

      expect(
        calculatedEndAt.resolve({
          startAt: moment().add(1, "days"),
          endAt: moment().add(32, "days"),
        })
      ).toEqual(null)
    })

    it("returns properly formatted distance string", async () => {
      const { resolvers } = await getGravityStitchedSchema()
      const { calculatedEndAt } = resolvers.ViewingRoom

      expect(
        calculatedEndAt.resolve({
          startAt: moment().subtract(1, "days"),
          endAt: moment().add(2, "days"),
        })
      ).toEqual({
        days: 2,
      })

      expect(
        calculatedEndAt.resolve({
          startAt: moment().subtract(1, "hour"),
          endAt: moment().add(2, "hours"),
        })
      ).toEqual({ hours: 2 })

      expect(
        calculatedEndAt.resolve({
          startAt: moment().subtract(1, "minute"),
          endAt: moment().add(10, "minutes"),
        })
      ).toEqual({ minutes: 10 })

      expect(
        calculatedEndAt.resolve({
          startAt: moment().subtract(1, "minute"),
          endAt: moment().subtract(10, "minutes"),
        })
      ).toEqual(null)
    })
  })

  describe("#formattedEndAt", () => {
    it("extends the ViewingRoom type with a formattedEndAt field", async () => {
      const mergedSchema = await getGravityMergedSchema()
      const fields = await getFieldsForTypeFromSchema(
        "ViewingRoom",
        mergedSchema
      )

      expect(fields).toContain("formattedEndAt")
    })

    it("returns null if endAt date is greater than 30 days", async () => {
      const { resolvers } = await getGravityStitchedSchema()
      const { formattedEndAt } = resolvers.ViewingRoom

      expect(
        formattedEndAt.resolve({
          startAt: moment().add(1, "days"),
          endAt: moment().add(32, "days"),
        })
      ).toEqual(null)
    })

    it("returns properly formatted distance string", async () => {
      const { resolvers } = await getGravityStitchedSchema()
      const { formattedEndAt } = resolvers.ViewingRoom

      expect(
        formattedEndAt.resolve({
          startAt: moment().subtract(1, "days"),
          endAt: moment().add(2, "days"),
        })
      ).toEqual("Closes in 2 days")

      expect(
        formattedEndAt.resolve({
          startAt: moment().subtract(1, "hour"),
          endAt: moment().add(2, "hours"),
        })
      ).toEqual("Closes in about 2 hours")

      expect(
        formattedEndAt.resolve({
          startAt: moment().subtract(1, "minute"),
          endAt: moment().add(10, "minutes"),
        })
      ).toEqual("Closes in about 10 minutes")

      expect(
        formattedEndAt.resolve({
          startAt: moment().subtract(1, "minute"),
          endAt: moment().subtract(10, "minutes"),
        })
      ).toEqual("Closed")
    })
  })

  describe("#partner", () => {
    it("extends the ViewingRoom type with a partner field", async () => {
      const mergedSchema = await getGravityMergedSchema()
      const artworkConnectionFields = await getFieldsForTypeFromSchema(
        "ViewingRoom",
        mergedSchema
      )

      expect(artworkConnectionFields).toContain("partner")
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
  })

  describe("#viewingRoomsConnection", () => {
    it("extends the Partner type with a viewingRoomsConnection field", async () => {
      const mergedSchema = await getGravityMergedSchema()
      const partnerFields = await getFieldsForTypeFromSchema(
        "Partner",
        mergedSchema
      )

      expect(partnerFields).toContain("viewingRoomsConnection")
    })

    it("resolves the viewing rooms field on Partner as a paginated list", async () => {
      const { resolvers } = await getGravityStitchedSchema()
      const { viewingRoomsConnection } = resolvers.Partner
      const info = { mergeInfo: { delegateToSchema: jest.fn() } }

      viewingRoomsConnection.resolve(
        { internalID: "partner-id" },
        { first: 2 },
        {},
        info
      )

      expect(info.mergeInfo.delegateToSchema).toHaveBeenCalledWith({
        args: { partnerId: "partner-id", first: 2 },
        operation: "query",
        fieldName: "viewingRooms",
        schema: expect.anything(),
        context: expect.anything(),
        info: expect.anything(),
      })
    })
  })
})
