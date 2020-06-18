import { getFieldsForTypeFromSchema } from "lib/stitching/lib/getTypesFromSchema"
import {
  getGravityMergedSchema,
  getGravityStitchedSchema,
} from "./testingUtils"
import moment, { DurationInputArg2, DurationInputArg1 } from "moment"

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

  describe("#formattedEndAt", () => {
    it("extends the ViewingRoom type with a formattedEndAt field", async () => {
      const mergedSchema = await getGravityMergedSchema()
      const fields = await getFieldsForTypeFromSchema(
        "ViewingRoom",
        mergedSchema
      )

      expect(fields).toContain("formattedEndAt")
    })

    it("returns null if endAt date or startAt date is missing", async () => {
      const { resolvers } = await getGravityStitchedSchema()
      const { formattedEndAt } = resolvers.ViewingRoom

      expect(
        formattedEndAt.resolve({
          startAt: null,
          endAt: moment().add(3, "days"),
        })
      ).toEqual(null)

      expect(
        formattedEndAt.resolve({
          startAt: moment().subtract(20, "minute"),
          endAt: null,
        })
      ).toEqual(null)
    })

    it("returns null if endAt date is in the past or if startAt date is in the future", async () => {
      const { resolvers } = await getGravityStitchedSchema()
      const { formattedEndAt } = resolvers.ViewingRoom

      // not opened yet
      expect(
        formattedEndAt.resolve({
          startAt: moment().add(1, "days"),
          endAt: moment().add(32, "days"),
        })
      ).toEqual(null)

      // closed already
      expect(
        formattedEndAt.resolve({
          startAt: moment().subtract(20, "minute"),
          endAt: moment().subtract(10, "minutes"),
        })
      ).toEqual(null)
    })

    it("returns properly formatted distance string", async () => {
      const { resolvers } = await getGravityStitchedSchema()
      const { formattedEndAt } = resolvers.ViewingRoom

      const cases: Array<[[DurationInputArg1, DurationInputArg2], string]> = [
        [[1, "day"], "1 day"],
        [[2, "days"], "2 days"],
        [[1, "hour"], "1 hour"],
        [[2, "hours"], "2 hours"],
        [[1, "minute"], "1 minute"],
        [[10, "minutes"], "10 minutes"],
        [[1, "second"], "1 second"],
        [[20, "seconds"], "20 seconds"],
      ]
      cases.forEach((c) => {
        expect(
          formattedEndAt.resolve({
            startAt: moment().subtract(1, "days"),
            endAt: moment().add(...c[0]),
          })
        ).toEqual(c[1])
      })
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
