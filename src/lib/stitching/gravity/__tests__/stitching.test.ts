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
  describe("filterArtworksConnection", () => {
    it("extends the ArtistSeries type with a filterArtworksConnection field for the V2 schema", async () => {
      const schemaVersion = 2
      const mergedSchema = await getGravityMergedSchema(schemaVersion)
      const artistSeriesFields = await getFieldsForTypeFromSchema(
        "ArtistSeries",
        mergedSchema
      )
      expect(artistSeriesFields).toContain("filterArtworksConnection")
    })

    it("does not extend the ArtistSeries type with a filterArtworksConnection field for the V1 schema", async () => {
      const schemaVersion = 1
      const mergedSchema = await getGravityMergedSchema(schemaVersion)
      const artistSeriesFields = await getFieldsForTypeFromSchema(
        "ArtistSeries",
        mergedSchema
      )
      expect(artistSeriesFields).not.toContain("filterArtworksConnection")
    })

    it("resolves the filterArtworksConnection field on ArtistSeries for the V2 schema", async () => {
      const schemaVersion = 2
      const { resolvers } = await getGravityStitchedSchema(schemaVersion)
      const { filterArtworksConnection } = resolvers.ArtistSeries
      const info = { mergeInfo: { delegateToSchema: jest.fn() } }

      filterArtworksConnection.resolve(
        { internalID: "abc123" },
        { first: 2 },
        {},
        info
      )

      expect(info.mergeInfo.delegateToSchema).toHaveBeenCalledWith({
        args: { artistSeriesID: "abc123", first: 2 },
        operation: "query",
        fieldName: "artworksConnection",
        schema: expect.anything(),
        context: expect.anything(),
        info: expect.anything(),
      })
    })

    it("does not resolve the filterArtworksConnection field on ArtistSeries for the V1 schema", async () => {
      const schemaVersion = 1
      const { resolvers } = await getGravityStitchedSchema(schemaVersion)
      expect(resolvers.ArtistSeries.filterArtworksConnection).toBeUndefined()
    })
  })

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
      const { artworksConnection } = resolvers.ViewingRoom
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
      const { distanceToOpen } = resolvers.ViewingRoom

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
      const { distanceToOpen } = resolvers.ViewingRoom
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
      const { distanceToOpen } = resolvers.ViewingRoom

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
      const { distanceToOpen } = resolvers.ViewingRoom

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
      const { distanceToClose } = resolvers.ViewingRoom

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
      const { distanceToClose } = resolvers.ViewingRoom
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
      const { distanceToClose } = resolvers.ViewingRoom
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
      const { distanceToClose } = resolvers.ViewingRoom

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
      const { distanceToClose } = resolvers.ViewingRoom

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
        args: { partnerID: "partner-id", first: 2 },
        operation: "query",
        fieldName: "viewingRooms",
        schema: expect.anything(),
        context: expect.anything(),
        info: expect.anything(),
      })
    })
  })

  describe("#artists", () => {
    it("extends the ArtistSeries type with artists field", async () => {
      const mergedSchema = await getGravityMergedSchema()
      const artists = await getFieldsForTypeFromSchema(
        "ArtistSeries",
        mergedSchema
      )

      expect(artists).toContain("artists")
    })

    it("resolves the artists field on ArtistSeries", async () => {
      const { resolvers } = await getGravityStitchedSchema()
      const { artists } = resolvers.ArtistSeries
      const info = { mergeInfo: { delegateToSchema: jest.fn() } }

      artists.resolve({ artistIDs: ["fakeid"] }, {}, {}, info)

      expect(info.mergeInfo.delegateToSchema).toHaveBeenCalledWith({
        args: { ids: ["fakeid"] },
        operation: "query",
        fieldName: "artists",
        schema: expect.anything(),
        context: expect.anything(),
        info: expect.anything(),
      })
    })
  })

  describe("#artist", () => {
    it("extends the Artist type with an artistSeriesConnection field", async () => {
      const mergedSchema = await getGravityMergedSchema()
      const artist = await getFieldsForTypeFromSchema("Artist", mergedSchema)

      expect(artist).toContain("artistSeriesConnection")
    })

    it("resolves the artistSeriesConnection field on Artist", async () => {
      const { resolvers } = await getGravityStitchedSchema()
      const { artistSeriesConnection } = resolvers.Artist
      const info = { mergeInfo: { delegateToSchema: jest.fn() } }

      artistSeriesConnection.resolve(
        { internalID: "fakeid" },
        { first: 5 },
        {},
        info
      )

      expect(info.mergeInfo.delegateToSchema).toHaveBeenCalledWith({
        args: { artistID: "fakeid", first: 5 },
        operation: "query",
        fieldName: "artistSeriesConnection",
        schema: expect.anything(),
        context: expect.anything(),
        info: expect.anything(),
      })
    })
  })

  describe("#image", () => {
    it("includes an image for an artist series", async () => {
      const { resolvers } = await getGravityStitchedSchema()
      const { image } = resolvers.ArtistSeries
      const info = { mergeInfo: { delegateToSchema: jest.fn() } }
      const artistSeriesData = {
        image_url: "cat.jpg",
        original_height: 200,
        original_width: 200,
        representativeArtworkID: "artwork-id",
      }
      image.resolve(artistSeriesData, {}, {}, info)

      const imageData = {
        image_url: "cat.jpg",
        original_height: 200,
        original_width: 200,
      }
      expect(info.mergeInfo.delegateToSchema).toHaveBeenCalledWith({
        args: expect.anything(),
        operation: "query",
        fieldName: "_do_not_use_image",
        schema: expect.anything(),
        context: { imageData },
        info: expect.anything(),
      })
    })

    it("uses the representative artwork for an artist series if no image is set", async () => {
      const { resolvers } = await getGravityStitchedSchema()
      const { image } = resolvers.ArtistSeries
      const info = { mergeInfo: { delegateToSchema: jest.fn() } }
      const artistSeriesData = {
        image_url: null,
        original_height: null,
        original_width: null,
        representativeArtworkID: "artwork-id",
      }

      const imageData = {
        image_url: "cat.jpg",
        original_height: 200,
        original_width: 200,
      }
      const artworkLoader = () =>
        Promise.resolve({
          images: [imageData],
        })
      const context = {
        artworkLoader,
      }
      await image.resolve(artistSeriesData, {}, context, info)

      expect(info.mergeInfo.delegateToSchema).toHaveBeenCalledWith({
        args: expect.anything(),
        operation: "query",
        fieldName: "_do_not_use_image",
        schema: expect.anything(),
        context: expect.objectContaining({ imageData }),
        info: expect.anything(),
      })
    })
  })
})
