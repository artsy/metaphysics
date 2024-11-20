import { getFieldsForTypeFromSchema } from "lib/stitching/lib/getTypesFromSchema"
import {
  getGravityMergedSchema,
  getGravityStitchedSchema,
} from "./testingUtils"
import moment, { DurationInputArg2, DurationInputArg1 } from "moment"

const momentAdd = (...args) => {
  return moment()
    .add(...args)
    .toISOString()
}
const momentSubtract = (...args) => {
  return moment()
    .subtract(...args)
    .toISOString()
}

describe("gravity/stitching", () => {
  describe("#artworksConnection", () => {
    describe("ViewingRoom", () => {
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
        const { artworksConnection } = resolvers.ViewingRoom!
        const info = { mergeInfo: { delegateToSchema: jest.fn() } }

        artworksConnection.resolve(
          { artworkIDs: ["1", "2", "3"] },
          { first: 2 },
          {},
          info
        )

        expect(info.mergeInfo.delegateToSchema).toHaveBeenCalledWith({
          args: { ids: ["1", "2", "3"], respectParamsOrder: true, first: 2 },
          operation: "query",
          fieldName: "artworks",
          schema: expect.anything(),
          context: expect.anything(),
          info: expect.anything(),
        })
      })

      it("converts empty artworkIDs argument", async () => {
        const { resolvers } = await getGravityStitchedSchema()
        const { artworksConnection } = resolvers.ViewingRoom!
        const info = { mergeInfo: { delegateToSchema: jest.fn() } }

        artworksConnection.resolve({ artworkIDs: [] }, { first: 2 }, {}, info)

        expect(info.mergeInfo.delegateToSchema).toHaveBeenCalledWith({
          args: { ids: [null], respectParamsOrder: true, first: 2 },
          operation: "query",
          fieldName: "artworks",
          schema: expect.anything(),
          context: expect.anything(),
          info: expect.anything(),
        })
      })
    })
  })

  describe("#distanceToOpen", () => {
    it("extends the ViewingRoom type with a distanceToOpen field", async () => {
      const mergedSchema = await getGravityMergedSchema()
      const fields = await getFieldsForTypeFromSchema(
        "ViewingRoom",
        mergedSchema
      )

      expect(fields).toContain("distanceToOpen")
    })

    it("returns null if startAt date is missing", async () => {
      const { resolvers } = await getGravityStitchedSchema()
      const { distanceToOpen } = resolvers.ViewingRoom!

      expect(distanceToOpen.resolve({ startAt: null }, {})).toEqual(null)

      expect(
        distanceToOpen.resolve({ startAt: null }, { short: false })
      ).toEqual(null)

      expect(
        distanceToOpen.resolve({ startAt: null }, { short: true })
      ).toEqual(null)
    })

    it("returns null if startAt date is in the past", async () => {
      const { resolvers } = await getGravityStitchedSchema()
      const { distanceToOpen } = resolvers.ViewingRoom!
      expect(
        distanceToOpen.resolve({ startAt: momentSubtract(1, "second") }, {})
      ).toEqual(null)

      expect(
        distanceToOpen.resolve(
          { startAt: momentSubtract(1, "second") },
          { short: false }
        )
      ).toEqual(null)

      expect(
        distanceToOpen.resolve(
          { startAt: momentSubtract(1, "second") },
          { short: true }
        )
      ).toEqual(null)
    })

    it("returns properly formatted distance string for long timeframe", async () => {
      const { resolvers } = await getGravityStitchedSchema()
      const { distanceToOpen } = resolvers.ViewingRoom!

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
          distanceToOpen.resolve(
            { startAt: momentAdd(...c[0]) },
            { short: false }
          )
        ).toEqual(c[1])
      })
    })

    it("returns properly formatted distance string for short timeframe", async () => {
      const { resolvers } = await getGravityStitchedSchema()
      const { distanceToOpen } = resolvers.ViewingRoom!

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
          distanceToOpen.resolve(
            { startAt: momentAdd(...c[0]) },
            { short: true }
          )
        ).toEqual(c[1])
      })
    })
  })

  describe("#distanceToClose", () => {
    it("extends the ViewingRoom type with a distanceToClose field", async () => {
      const mergedSchema = await getGravityMergedSchema()
      const fields = await getFieldsForTypeFromSchema(
        "ViewingRoom",
        mergedSchema
      )

      expect(fields).toContain("distanceToClose")
    })

    it("returns null if endAt date is missing", async () => {
      const { resolvers } = await getGravityStitchedSchema()
      const { distanceToClose } = resolvers.ViewingRoom!

      expect(
        distanceToClose.resolve(
          { startAt: momentSubtract(2, "seconds"), endAt: null },
          {}
        )
      ).toEqual(null)

      expect(
        distanceToClose.resolve(
          { startAt: momentSubtract(2, "seconds"), endAt: null },
          { short: false }
        )
      ).toEqual(null)

      expect(
        distanceToClose.resolve(
          { startAt: momentSubtract(2, "seconds"), endAt: null },
          { short: true }
        )
      ).toEqual(null)
    })

    it("returns null if endAt date is in the past", async () => {
      const { resolvers } = await getGravityStitchedSchema()
      const { distanceToClose } = resolvers.ViewingRoom!
      expect(
        distanceToClose.resolve(
          {
            startAt: momentSubtract(2, "seconds"),
            endAt: momentSubtract(1, "second"),
          },
          {}
        )
      ).toEqual(null)

      expect(
        distanceToClose.resolve(
          {
            startAt: momentSubtract(2, "seconds"),
            endAt: momentSubtract(1, "second"),
          },
          { short: false }
        )
      ).toEqual(null)

      expect(
        distanceToClose.resolve(
          {
            startAt: momentSubtract(2, "seconds"),
            endAt: momentSubtract(1, "second"),
          },
          { short: true }
        )
      ).toEqual(null)
    })

    it("returns null if startAt date is in the future", async () => {
      const { resolvers } = await getGravityStitchedSchema()
      const { distanceToClose } = resolvers.ViewingRoom!
      expect(
        distanceToClose.resolve(
          { startAt: momentAdd(1, "days"), endAt: momentAdd(4, "days") },
          {}
        )
      ).toEqual(null)

      expect(
        distanceToClose.resolve(
          { startAt: momentAdd(1, "days"), endAt: momentAdd(4, "days") },
          { short: false }
        )
      ).toEqual(null)

      expect(
        distanceToClose.resolve(
          { startAt: momentAdd(1, "days"), endAt: momentAdd(4, "days") },
          { short: true }
        )
      ).toEqual(null)
    })

    it("returns properly formatted distance string for long timeframe", async () => {
      const { resolvers } = await getGravityStitchedSchema()
      const { distanceToClose } = resolvers.ViewingRoom!

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
        [[11, "days"], "11 days"],
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
          distanceToClose.resolve(
            {
              startAt: momentSubtract(2, "second"),
              endAt: momentAdd(...c[0]),
            },
            { short: false }
          )
        ).toEqual(c[1])
      })
    })

    it("returns properly formatted distance string for short timeframe", async () => {
      const { resolvers } = await getGravityStitchedSchema()
      const { distanceToClose } = resolvers.ViewingRoom!

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
          distanceToClose.resolve(
            {
              startAt: momentSubtract(2, "second"),
              endAt: momentAdd(...c[0]),
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
      const { partner } = resolvers.ViewingRoom!
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

  describe("#exhibitionPeriod", () => {
    it("extends the ViewingRoom type with a exhibitionPeriod field", async () => {
      const mergedSchema = await getGravityMergedSchema()
      const artworkConnectionFields = await getFieldsForTypeFromSchema(
        "ViewingRoom",
        mergedSchema
      )

      expect(artworkConnectionFields).toContain("exhibitionPeriod")
    })

    it("resolves the exhibitionPeriod field on ViewingRoom", async () => {
      const { resolvers } = await getGravityStitchedSchema()
      const { exhibitionPeriod } = resolvers.ViewingRoom!
      const startAt = moment("2021-09-01T00:00:00Z")
      const endAt = moment("2021-09-30T00:00:00Z")

      expect(
        exhibitionPeriod.resolve({
          startAt: startAt,
          endAt: endAt,
        })
      ).toEqual("September 1 – 30, 2021")
    })

    it("returns Invalid dates if dates are missing", async () => {
      const { resolvers } = await getGravityStitchedSchema()
      const { exhibitionPeriod } = resolvers.ViewingRoom!
      const startAt = moment.utc().add(1, "days").format("MMMM D")
      const endAt = moment.utc().add(30, "days").format("MMMM D")
      const startAtYear = moment.utc().add(1, "days").format("YYYY")
      const endAtAtYear = moment.utc().add(30, "days").format("YYYY")

      expect(
        exhibitionPeriod.resolve({
          startAt: null,
          endAt: momentAdd(30, "days"),
        })
      ).toEqual(`Invalid date – ${endAt}, ${endAtAtYear}`)

      expect(
        exhibitionPeriod.resolve({
          startAt: momentAdd(1, "days"),
          endAt: null,
        })
      ).toEqual(`${startAt}, ${startAtYear} – Invalid date`)

      expect(
        exhibitionPeriod.resolve({
          startAt: null,
          endAt: null,
        })
      ).toEqual("Invalid date – Invalid date")
    })
  })

  describe("#viewingRoomsConnection in Partner", () => {
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
      const { viewingRoomsConnection } = resolvers.Partner!
      const info = { mergeInfo: { delegateToSchema: jest.fn() } }

      viewingRoomsConnection.resolve(
        { internalID: "partner-id" },
        { first: 2 },
        {},
        info
      )

      expect(info.mergeInfo.delegateToSchema).toHaveBeenCalledWith({
        args: { partnerID: "partner-id", first: 2 },
        operation: "query",
        fieldName: "viewingRoomsConnection",
        schema: expect.anything(),
        context: expect.anything(),
        info: expect.anything(),
      })
    })
  })

  describe("#viewingRoomsConnection in Show", () => {
    it("extends the Show type with a viewingRoomsConnection field", async () => {
      const mergedSchema = await getGravityMergedSchema()
      const showFields = await getFieldsForTypeFromSchema("Show", mergedSchema)

      expect(showFields).toContain("viewingRoomsConnection")
    })

    it("resolves the viewingRoomsConnection field on Show", async () => {
      const { resolvers } = await getGravityStitchedSchema()
      const { viewingRoomsConnection } = resolvers.Show!
      const info = { mergeInfo: { delegateToSchema: jest.fn() } }

      viewingRoomsConnection.resolve(
        { viewingRoomIDs: ["view-lots-of-cats-id"] },
        {},
        {},
        info
      )

      expect(info.mergeInfo.delegateToSchema).toHaveBeenCalledWith({
        args: { ids: ["view-lots-of-cats-id"] },
        operation: "query",
        fieldName: "viewingRoomsConnection",
        schema: expect.anything(),
        context: expect.anything(),
        info: expect.anything(),
      })
    })
  })

  describe("#Viewer", () => {
    describe("#viewingRoomsConnection in Viewer", () => {
      it("extends the Viewer type with a viewingRoomsConnection field", async () => {
        const mergedSchema = await getGravityMergedSchema()
        const viewerFields = await getFieldsForTypeFromSchema(
          "Viewer",
          mergedSchema
        )

        expect(viewerFields).toContain("viewingRoomsConnection")
      })
    })
  })

  describe("#addressConnection", () => {
    it("extends the Me type with an addressConnection field", async () => {
      const mergedSchema = await getGravityMergedSchema()
      const addressConnectionFields = await getFieldsForTypeFromSchema(
        "Me",
        mergedSchema
      )
      expect(addressConnectionFields).toContain("addressConnection")
    })

    it("resolves addressConnection on Me as a paginated list", async () => {
      const { resolvers } = await getGravityStitchedSchema()
      const { addressConnection } = resolvers.Me
      const info = { mergeInfo: { delegateToSchema: jest.fn() } }

      addressConnection.resolve({}, { first: 2 }, { userID: 1 }, info)

      expect(info.mergeInfo.delegateToSchema).toHaveBeenCalledWith({
        args: { userId: 1, first: 2 },
        operation: "query",
        fieldName: "_unused_gravity_userAddressConnection",
        schema: expect.anything(),
        context: expect.anything(),
        info: expect.anything(),
      })
    })
  })

  describe("#UserAddress", () => {
    it("extends the UserAddress type with an id field", async () => {
      const mergedSchema = await getGravityMergedSchema()
      const userAddressField = await getFieldsForTypeFromSchema(
        "UserAddress",
        mergedSchema
      )

      expect(userAddressField).toContain("id")
    })
  })
})
