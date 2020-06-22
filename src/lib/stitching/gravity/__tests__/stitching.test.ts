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

  describe("#formattedStartAt", () => {
    it("extends the ViewingRoom type with a formattedStartAt field", async () => {
      const mergedSchema = await getGravityMergedSchema()
      const fields = await getFieldsForTypeFromSchema(
        "ViewingRoom",
        mergedSchema
      )

      expect(fields).toContain("formattedStartAt")
    })

    it("returns null if startAt date is missing", async () => {
      const { resolvers } = await getGravityStitchedSchema()
      const { formattedStartAt } = resolvers.ViewingRoom

      expect(formattedStartAt.resolve({ startAt: null }, {})).toEqual(null)

      expect(
        formattedStartAt.resolve({ startAt: null }, { short: false })
      ).toEqual(null)

      expect(
        formattedStartAt.resolve({ startAt: null }, { short: true })
      ).toEqual(null)
    })

    it("returns null if startAt date is in the past", async () => {
      const { resolvers } = await getGravityStitchedSchema()
      const { formattedStartAt } = resolvers.ViewingRoom
      expect(
        formattedStartAt.resolve(
          { startAt: moment().subtract(1, "second") },
          {}
        )
      ).toEqual(null)

      expect(
        formattedStartAt.resolve(
          { startAt: moment().subtract(1, "second") },
          { short: false }
        )
      ).toEqual(null)

      expect(
        formattedStartAt.resolve(
          { startAt: moment().subtract(1, "second") },
          { short: true }
        )
      ).toEqual(null)
    })

    it("returns properly formatted distance string for long timeframe", async () => {
      const { resolvers } = await getGravityStitchedSchema()
      const { formattedStartAt } = resolvers.ViewingRoom

      const cases: Array<[
        [DurationInputArg1, DurationInputArg2],
        string | null
      ]> = [
        [[2, "years"], null],
        [[2, "months"], null],
        [[40, "days"], null],
        [[31, "days"], null],
        [[30, "days"], "30 days"],
        [[29, "days"], "29 days"],
        [[2, "days"], "2 days"],
        [[1, "day"], "1 day"],
        [[2, "hours"], "2 hours"],
        [[1, "hour"], "1 hour"],
        [[10, "minutes"], "10 minutes"],
        [[1, "minute"], "1 minute"],
        [[20, "seconds"], "20 seconds"],
        [[1, "second"], "1 second"],
      ]
      cases.forEach((c) => {
        expect(
          formattedStartAt.resolve(
            { startAt: moment().add(...c[0]) },
            { short: false }
          )
        ).toEqual(c[1])
      })
    })

    it("returns properly formatted distance string for short timeframe", async () => {
      const { resolvers } = await getGravityStitchedSchema()
      const { formattedStartAt } = resolvers.ViewingRoom

      const cases: Array<[
        [DurationInputArg1, DurationInputArg2],
        string | null
      ]> = [
        [[2, "years"], "soon"],
        [[2, "months"], "soon"],
        [[40, "days"], "soon"],
        [[31, "days"], "soon"],
        [[30, "days"], "soon"],
        [[29, "days"], "soon"],
        [[2, "days"], "soon"],
        [[1, "day"], "soon"],
        [[2, "hours"], "soon"],
        [[1, "hour"], "soon"],
        [[10, "minutes"], "soon"],
        [[1, "minute"], "soon"],
        [[20, "seconds"], "soon"],
        [[1, "second"], "soon"],
      ]
      cases.forEach((c) => {
        expect(
          formattedStartAt.resolve(
            { startAt: moment().add(...c[0]) },
            { short: true }
          )
        ).toEqual(c[1])
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

    it("returns null if endAt date is missing", async () => {
      const { resolvers } = await getGravityStitchedSchema()
      const { formattedEndAt } = resolvers.ViewingRoom

      expect(
        formattedEndAt.resolve(
          { startAt: moment().subtract(2, "second"), endAt: null },
          {}
        )
      ).toEqual(null)

      expect(
        formattedEndAt.resolve(
          { startAt: moment().subtract(2, "second"), endAt: null },
          { short: false }
        )
      ).toEqual(null)

      expect(
        formattedEndAt.resolve(
          { startAt: moment().subtract(2, "second"), endAt: null },
          { short: true }
        )
      ).toEqual(null)
    })

    it("returns null if endAt date is in the past", async () => {
      const { resolvers } = await getGravityStitchedSchema()
      const { formattedEndAt } = resolvers.ViewingRoom
      expect(
        formattedEndAt.resolve(
          {
            startAt: moment().subtract(2, "second"),
            endAt: moment().subtract(1, "second"),
          },
          {}
        )
      ).toEqual(null)

      expect(
        formattedEndAt.resolve(
          {
            startAt: moment().subtract(2, "second"),
            endAt: moment().subtract(1, "second"),
          },
          { short: false }
        )
      ).toEqual(null)

      expect(
        formattedEndAt.resolve(
          {
            startAt: moment().subtract(2, "second"),
            endAt: moment().subtract(1, "second"),
          },
          { short: true }
        )
      ).toEqual(null)
    })

    it("returns null if startAt date is in the future", async () => {
      const { resolvers } = await getGravityStitchedSchema()
      const { formattedEndAt } = resolvers.ViewingRoom
      expect(
        formattedEndAt.resolve(
          { startAt: moment().add(1, "days"), endAt: moment().add(4, "days") },
          {}
        )
      ).toEqual(null)

      expect(
        formattedEndAt.resolve(
          { startAt: moment().add(1, "days"), endAt: moment().add(4, "days") },
          { short: false }
        )
      ).toEqual(null)

      expect(
        formattedEndAt.resolve(
          { startAt: moment().add(1, "days"), endAt: moment().add(4, "days") },
          { short: true }
        )
      ).toEqual(null)
    })

    it("returns properly formatted distance string for long timeframe", async () => {
      const { resolvers } = await getGravityStitchedSchema()
      const { formattedEndAt } = resolvers.ViewingRoom

      const cases: Array<[
        [DurationInputArg1, DurationInputArg2],
        string | null
      ]> = [
        [[2, "years"], null],
        [[2, "months"], null],
        [[40, "days"], null],
        [[11, "days"], null],
        [[10, "days"], "10 days"],
        [[2, "days"], "2 days"],
        [[1, "day"], "1 day"],
        [[2, "hours"], "2 hours"],
        [[1, "hour"], "1 hour"],
        [[10, "minutes"], "10 minutes"],
        [[1, "minute"], "1 minute"],
        [[20, "seconds"], "20 seconds"],
        [[1, "second"], "1 second"],
      ]
      cases.forEach((c) => {
        expect(
          formattedEndAt.resolve(
            {
              startAt: moment().subtract(2, "second"),
              endAt: moment().add(...c[0]),
            },
            { short: false }
          )
        ).toEqual(c[1])
      })
    })

    it("returns properly formatted distance string for short timeframe", async () => {
      const { resolvers } = await getGravityStitchedSchema()
      const { formattedEndAt } = resolvers.ViewingRoom

      const cases: Array<[
        [DurationInputArg1, DurationInputArg2],
        string | null
      ]> = [
        [[2, "years"], null],
        [[2, "months"], null],
        [[40, "days"], null],
        [[6, "days"], null],
        [[5, "days"], "5 days"],
        [[2, "days"], "2 days"],
        [[1, "day"], "1 day"],
        [[2, "hours"], "2 hours"],
        [[1, "hour"], "1 hour"],
        [[10, "minutes"], "10 minutes"],
        [[1, "minute"], "1 minute"],
        [[20, "seconds"], "20 seconds"],
        [[1, "second"], "1 second"],
      ]
      cases.forEach((c) => {
        expect(
          formattedEndAt.resolve(
            {
              startAt: moment().subtract(2, "second"),
              endAt: moment().add(...c[0]),
            },
            { short: true }
          )
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
