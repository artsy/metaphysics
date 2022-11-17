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
      const mergedSchema = await getGravityMergedSchema()
      const artistSeriesFields = await getFieldsForTypeFromSchema(
        "ArtistSeries",
        mergedSchema
      )
      expect(artistSeriesFields).toContain("filterArtworksConnection")
    })

    it("resolves the filterArtworksConnection field on ArtistSeries for the V2 schema", async () => {
      const { resolvers } = await getGravityStitchedSchema()
      const { filterArtworksConnection } = resolvers.ArtistSeries
      const info = { mergeInfo: { delegateToSchema: jest.fn() } }

      filterArtworksConnection.resolve(
        { internalID: "abc123" },
        { first: 2 },
        { currentArtworkID: "catty-artwork" },
        info
      )

      expect(info.mergeInfo.delegateToSchema).toHaveBeenCalledWith({
        args: {
          artistSeriesID: "abc123",
          first: 2,
          excludeArtworkIDs: ["catty-artwork"],
        },
        operation: "query",
        fieldName: "artworksConnection",
        schema: expect.anything(),
        context: expect.anything(),
        info: expect.anything(),
      })
    })
  })

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

    describe("ArtistSeries", () => {
      it("resolves the artworksConnection field on ArtistSeries for the V2 schema", async () => {
        const { resolvers } = await getGravityStitchedSchema()
        const { artworksConnection } = resolvers.ArtistSeries
        const info = { mergeInfo: { delegateToSchema: jest.fn() } }

        artworksConnection.resolve(
          { artworkIDs: ["abc123"] },
          { first: 2 },
          {},
          info
        )

        expect(info.mergeInfo.delegateToSchema).toHaveBeenCalledWith({
          args: { ids: ["abc123"], first: 2 },
          operation: "query",
          fieldName: "artworks",
          schema: expect.anything(),
          context: expect.anything(),
          info: expect.anything(),
        })
      })

      describe("with a current artwork in context", () => {
        it("excludes the current artwork from the artworksConnection query", async () => {
          const context = { currentArtworkID: "xyz456" }
          const { resolvers } = await getGravityStitchedSchema()
          const { artworksConnection } = resolvers.ArtistSeries
          const info = { mergeInfo: { delegateToSchema: jest.fn() } }

          artworksConnection.resolve(
            { artworkIDs: ["abc123", "xyz456"] },
            { first: 2 },
            context,
            info
          )

          expect(info.mergeInfo.delegateToSchema).toHaveBeenCalledWith({
            args: { ids: ["abc123"], first: 2 },
            operation: "query",
            fieldName: "artworks",
            schema: expect.anything(),
            context: expect.anything(),
            info: expect.anything(),
          })
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
      const { exhibitionPeriod } = resolvers.ViewingRoom
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
      const { exhibitionPeriod } = resolvers.ViewingRoom
      const startAt = moment().add(1, "days").format("MMMM D")
      const endAt = moment().add(30, "days").format("MMMM D")
      const startAtYear = moment().add(1, "days").format("YYYY")
      const endAtAtYear = moment().add(30, "days").format("YYYY")

      expect(
        exhibitionPeriod.resolve({
          startAt: null,
          endAt: momentAdd(30, "days"),
        })
      ).toEqual(`${"Invalid date"} – ${endAt}, ${endAtAtYear}`)

      expect(
        exhibitionPeriod.resolve({
          startAt: momentAdd(1, "days"),
          endAt: null,
        })
      ).toEqual(`${startAt}, ${startAtYear} – ${"Invalid date"}`)

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
        fieldName: "_unused_gravity_viewingRoomsConnection",
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
      const { viewingRoomsConnection } = resolvers.Show
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
        fieldName: "_unused_gravity_viewingRoomsConnection",
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

    describe("#marketingCollections", () => {
      it("extends the Viewer type with a marketingCollections field", async () => {
        const mergedSchema = await getGravityMergedSchema()
        const viewerFields = await getFieldsForTypeFromSchema(
          "Viewer",
          mergedSchema
        )

        expect(viewerFields).toContain("marketingCollections")
      })
    })
  })

  describe("#Query", () => {
    describe("#curatedMarketingCollections in Query", () => {
      it("extends the Query type with a curatedMarketingCollections field", async () => {
        const mergedSchema = await getGravityMergedSchema()
        const rootFields = await getFieldsForTypeFromSchema(
          "Query",
          mergedSchema
        )

        expect(rootFields).toContain("curatedMarketingCollections")
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

      artists.resolve(
        { artistIDs: ["fakeid"], internalID: "abc123" },
        {},
        {},
        info
      )

      expect(info.mergeInfo.delegateToSchema).toHaveBeenCalledWith({
        args: { ids: ["fakeid"] },
        operation: "query",
        fieldName: "artists",
        schema: expect.anything(),
        context: { currentArtistSeriesInternalID: "abc123" },
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

    describe("with an artistSeriesConnection with a current artist series in context", () => {
      it("resolves the artistSeriesConnection and excludes the current artist series", async () => {
        const context = { currentArtistSeriesInternalID: "abc123" }
        const { resolvers } = await getGravityStitchedSchema()
        const { artistSeriesConnection } = resolvers.Artist
        const info = { mergeInfo: { delegateToSchema: jest.fn() } }

        artistSeriesConnection.resolve(
          { internalID: "fakeid" },
          { first: 5 },
          context,
          info
        )

        expect(info.mergeInfo.delegateToSchema).toHaveBeenCalledWith({
          args: { artistID: "fakeid", first: 5, excludeIDs: ["abc123"] },
          operation: "query",
          fieldName: "artistSeriesConnection",
          schema: expect.anything(),
          context: expect.anything(),
          info: expect.anything(),
        })
      })
    })

    describe("#marketingCollections", () => {
      it("extends the Artist type with a marketingCollections field", async () => {
        const mergedSchema = await getGravityMergedSchema()
        const viewerFields = await getFieldsForTypeFromSchema(
          "Artist",
          mergedSchema
        )

        expect(viewerFields).toContain("marketingCollections")
      })

      it("passes artist internalID to marketingCollections' artistID arg when querying `... on Artist`", async () => {
        const { resolvers } = await getGravityStitchedSchema()
        const marketingCollectionsResolver =
          resolvers.Artist.marketingCollections.resolve
        const mergeInfo = { delegateToSchema: jest.fn() }

        await marketingCollectionsResolver(
          { internalID: "artist-internal-id" },
          {},
          {},
          { mergeInfo }
        )

        expect(mergeInfo.delegateToSchema).toHaveBeenCalledWith(
          expect.objectContaining({
            args: { artistID: "artist-internal-id" },
            fieldName: "marketingCollections",
          })
        )
      })
    })
  })

  describe("#artwork", () => {
    it("extends the Artwork type with an artistSeriesConnection field", async () => {
      const mergedSchema = await getGravityMergedSchema()
      const artwork = await getFieldsForTypeFromSchema("Artwork", mergedSchema)

      expect(artwork).toContain("artistSeriesConnection")
    })

    it("resolves the artistSeriesConnection field on Artwork", async () => {
      const { resolvers } = await getGravityStitchedSchema()
      const { artistSeriesConnection } = resolvers.Artwork
      const info = { mergeInfo: { delegateToSchema: jest.fn() } }

      artistSeriesConnection.resolve(
        { internalID: "fakeid" },
        { first: 5 },
        {},
        info
      )

      expect(info.mergeInfo.delegateToSchema).toHaveBeenCalledWith({
        args: { artworkID: "fakeid", first: 5 },
        operation: "query",
        fieldName: "artistSeriesConnection",
        schema: expect.anything(),
        context: { currentArtworkID: "fakeid" },
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

  describe("#descriptionFormatted", () => {
    it("converts from markdown to HTML", async () => {
      const { resolvers } = await getGravityStitchedSchema()
      const { descriptionFormatted } = resolvers.ArtistSeries
      const formattedDescription = await descriptionFormatted.resolve(
        { description: "**Bold Type**" },
        { format: "HTML" }
      )
      expect(formattedDescription).toEqual(
        "<p><strong>Bold Type</strong></p>\n"
      )
    })

    it("keeps markdown", async () => {
      const { resolvers } = await getGravityStitchedSchema()
      const { descriptionFormatted } = resolvers.ArtistSeries
      const formattedDescription = await descriptionFormatted.resolve(
        { description: "**Bold Type**" },
        { format: "MARKDOWN" }
      )
      expect(formattedDescription).toEqual("**Bold Type**")
    })
  })

  describe("#artworksCountMessage", () => {
    it("prefers for-sale artworks count", async () => {
      const { resolvers } = await getGravityStitchedSchema()
      const { artworksCountMessage } = resolvers.ArtistSeries
      const value = await artworksCountMessage.resolve({
        forSaleArtworksCount: 20,
        artworksCount: 10,
      })
      expect(value).toEqual("20 available")
    })

    it("falls back to general artworks count", async () => {
      const { resolvers } = await getGravityStitchedSchema()
      const { artworksCountMessage } = resolvers.ArtistSeries
      const value = await artworksCountMessage.resolve({
        forSaleArtworksCount: 0,
        artworksCount: 10,
      })
      expect(value).toEqual("10 works")
    })

    it("pluralizes correctly", async () => {
      const { resolvers } = await getGravityStitchedSchema()
      const { artworksCountMessage } = resolvers.ArtistSeries

      const zero = await artworksCountMessage.resolve({
        forSaleArtworksCount: 0,
        artworksCount: 0,
      })
      const one = await artworksCountMessage.resolve({
        forSaleArtworksCount: 0,
        artworksCount: 1,
      })
      const many = await artworksCountMessage.resolve({
        forSaleArtworksCount: 0,
        artworksCount: 42,
      })

      expect(zero).toEqual("0 works")
      expect(one).toEqual("1 work")
      expect(many).toEqual("42 works")
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

  describe("HomePageMarketingCollectionsModule", () => {
    it("extends the HomePageMarketingCollectionsModule object", async () => {
      const mergedSchema = await getGravityMergedSchema()
      const homePageMarketingCollectionsModuleFields = await getFieldsForTypeFromSchema(
        "HomePageMarketingCollectionsModule",
        mergedSchema
      )
      expect(homePageMarketingCollectionsModuleFields).toContain("results")
    })

    it("returns an array even if the marketingCollections request fails", async () => {
      const { resolvers } = await getGravityStitchedSchema()
      const resultsResolver =
        resolvers.HomePageMarketingCollectionsModule.results.resolve
      const delegateToSchemaMock = jest.fn()
      delegateToSchemaMock.mockRejectedValue(
        "simulating a marketingCollections request failure"
      )
      const mergeInfo = { delegateToSchema: delegateToSchemaMock }
      const results = await resultsResolver({}, {}, {}, { mergeInfo })
      expect(results).toEqual([])
    })
  })

  describe("Fair", () => {
    describe("#marketingCollections", () => {
      it("extends the Fair type with a marketingCollections field", async () => {
        const mergedSchema = await getGravityMergedSchema()
        const viewerFields = await getFieldsForTypeFromSchema(
          "Fair",
          mergedSchema
        )

        expect(viewerFields).toContain("marketingCollections")
      })

      it("passes through slugs when stitched under a fair", async () => {
        const { resolvers } = await getGravityStitchedSchema()
        const marketingCollectionsResolver =
          resolvers.Fair.marketingCollections.resolve
        const mergeInfo = { delegateToSchema: jest.fn() }

        await marketingCollectionsResolver(
          { marketingCollectionSlugs: ["catty-collection"] },
          {},
          {},
          { mergeInfo }
        )

        expect(mergeInfo.delegateToSchema).toHaveBeenCalledWith(
          expect.objectContaining({
            args: { slugs: ["catty-collection"] },
            fieldName: "marketingCollections",
          })
        )
      })

      it("returns an empty list when there are no marketingCollectionSlugs", async () => {
        const { resolvers } = await getGravityStitchedSchema()
        const marketingCollectionsResolver =
          resolvers.Fair.marketingCollections.resolve
        const mergeInfo = { delegateToSchema: jest.fn() }

        const result = await marketingCollectionsResolver(
          { marketingCollectionSlugs: [] },
          {},
          {},
          { mergeInfo }
        )

        expect(result).toEqual([])
      })
    })
  })

  describe("MarketingCollection", () => {
    describe("artworksConnection", () => {
      it("extends the MarketingCollection type with an artworksConnection field for the V2 schema", async () => {
        const mergedSchema = await getGravityMergedSchema()
        const marketingCollectionFields = await getFieldsForTypeFromSchema(
          "MarketingCollection",
          mergedSchema
        )
        expect(marketingCollectionFields).toContain("artworksConnection")
      })

      it("resolves the artworksConnection field on MarketingCollection for the V2 schema", async () => {
        const { resolvers } = await getGravityStitchedSchema()
        const { artworksConnection } = resolvers.MarketingCollection
        const info = { mergeInfo: { delegateToSchema: jest.fn() } }

        artworksConnection.resolve(
          { internalID: "abc123" },
          { first: 2 },
          { currentArtworkID: "catty-artwork" },
          info
        )

        expect(info.mergeInfo.delegateToSchema).toHaveBeenCalledWith({
          args: {
            marketingCollectionID: "abc123",
            first: 2,
          },
          operation: "query",
          fieldName: "artworksConnection",
          schema: expect.anything(),
          context: expect.anything(),
          info: expect.anything(),
        })
      })
    })
  })
})
