import { runQuery } from "schema/v2/test/utils"
import gql from "lib/gql"
import moment from "moment"
import config from "config"

describe("ViewingRoom", () => {
  beforeAll(() => {
    config.USE_UNSTITCHED_VIEWING_ROOM_SCHEMA = true
  })

  afterAll(() => {
    config.USE_UNSTITCHED_VIEWING_ROOM_SCHEMA = false
  })

  describe("all fields", () => {
    const query = gql`
      {
        viewingRoom(id: "example-viewing-room") {
          artworkIDs
          artworksConnection(first: 1) {
            totalCount
            edges {
              node {
                title
              }
            }
          }
          body
          endAt
          firstLiveAt
          heroImageURL
          href
          image {
            height
            width
            imageURLs {
              normalized
            }
            internalID
          }
          internalID
          introStatement
          partner {
            name
          }
          # partnerArtworksConnection(first: 1) {
          #   totalCount
          #   edges {
          #     node {
          #       title
          #     }
          #   }
          # }
          partnerID
          published
          pullQuote
          slug
          startAt
          status
          timeZone
          title
          # viewingRoomArtworks
        }
      }
    `

    const startAt = "2024-09-25T10:00:00.375Z"
    const endAt = "2024-09-27T10:00:00.375Z"
    const firstLiveAt = "2024-09-26T10:00:00.375Z"

    const viewingRoomData = {
      artwork_ids: ["artwork1", "artwork2"],
      body: "body",
      end_at: endAt,
      first_live_at: firstLiveAt,
      hero_image_url: "hero://image.url",
      image: {
        original_height: 100,
        oritinal_width: 100,
        image_urls: {
          normalized: "normalized://image.url",
        },
        id: "image-internal-id",
      },
      id: "viewing-room-id",
      intro_statement: "intro statement",
      partner_id: "partner-id",
      published: true,
      pull_quote: "pull quote",
      slug: "slug",
      start_at: startAt,
      status: "live",
      time_zone: "America/New_York",
      title: "Title",
    }

    const artworksLoader = jest.fn().mockResolvedValue([
      {
        title: "Artwork 1",
      },
      {
        title: "Artwork 2",
      },
    ])

    const partnerLoader = jest.fn().mockResolvedValue({
      name: "Partner Name",
    })

    const partnerArtworksLoader = jest.fn().mockResolvedValue({
      body: [
        {
          title: "Partner Artwork 1",
        },
        {
          title: "Partner Artwork 2",
        },
      ],
      headers: { "x-total-count": 2 },
    })

    const context = {
      viewingRoomLoader: jest.fn().mockResolvedValue(viewingRoomData),
      artworksLoader: artworksLoader,
      partnerLoader: partnerLoader,
      partnerArtworksLoader: partnerArtworksLoader,
    }

    it("resolves viewing room data", async () => {
      const result = await runQuery(query, context)

      expect(artworksLoader).toHaveBeenCalledWith({
        ids: ["artwork1", "artwork2"],
        batched: true,
      })

      expect(partnerLoader).toHaveBeenCalledWith("partner-id")

      // expect(partnerArtworksLoader).toHaveBeenCalledWith("partner-id", {
      //   page: 1,
      //   size: 1,
      //   total_count: true,
      //   viewing_room_id: "viewing-room-id",
      // })

      expect(result).toMatchInlineSnapshot(`
        {
          "viewingRoom": {
            "artworkIDs": [
              "artwork1",
              "artwork2",
            ],
            "artworksConnection": {
              "edges": [
                {
                  "node": {
                    "title": "Artwork 1",
                  },
                },
              ],
              "totalCount": 2,
            },
            "body": "body",
            "endAt": "2024-09-27T10:00:00.375Z",
            "firstLiveAt": "2024-09-26T10:00:00.375Z",
            "heroImageURL": "hero://image.url",
            "href": "/viewing-room/slug",
            "image": {
              "height": 100,
              "imageURLs": {
                "normalized": "normalized://image.url",
              },
              "internalID": "image-internal-id",
              "width": null,
            },
            "internalID": "viewing-room-id",
            "introStatement": "intro statement",
            "partner": {
              "name": "Partner Name",
            },
            "partnerID": "partner-id",
            "published": true,
            "pullQuote": "pull quote",
            "slug": "slug",
            "startAt": "2024-09-25T10:00:00.375Z",
            "status": "live",
            "timeZone": "America/New_York",
            "title": "Title",
          },
        }
      `)
    })
  })

  describe("distanceToClose", () => {
    const fixedDate = new Date("2024-09-26 10:00:00")

    beforeAll(() => {
      jest.useFakeTimers("modern").setSystemTime(fixedDate)
    })

    afterAll(() => {
      jest.useRealTimers()
    })

    describe("noop conditions", () => {
      const query = gql`
        {
          viewingRoom(id: "example-viewing-room") {
            long: distanceToClose(short: false)
            short: distanceToClose(short: true)
          }
        }
      `

      it("returns null if endAt date is missing", async () => {
        const startAt = moment(fixedDate).add(1, "day").format()

        const viewingRoomData = {
          start_at: startAt,
          end_at: null,
        }

        const context = {
          viewingRoomLoader: jest.fn().mockResolvedValue(viewingRoomData),
        }

        const result = await runQuery(query, context)
        expect(result.viewingRoom.long).toEqual(null)
        expect(result.viewingRoom.short).toEqual(null)
      })

      it("returns null if endAt date is in the past", async () => {
        const startAt = moment(fixedDate).subtract(2, "days").format()
        const endAt = moment(fixedDate).subtract(1, "day").format()

        const viewingRoomData = {
          start_at: startAt,
          end_at: endAt,
        }

        const context = {
          viewingRoomLoader: jest.fn().mockResolvedValue(viewingRoomData),
        }

        const result = await runQuery(query, context)
        expect(result.viewingRoom.long).toEqual(null)
        expect(result.viewingRoom.short).toEqual(null)
      })

      it("returns null if startAt date is in the future", async () => {
        const startAt = moment(fixedDate).add(1, "day").format()
        const endAt = moment(fixedDate).add(2, "days").format()

        const viewingRoomData = {
          start_at: startAt,
          end_at: endAt,
        }

        const context = {
          viewingRoomLoader: jest.fn().mockResolvedValue(viewingRoomData),
        }

        const result = await runQuery(query, context)
        expect(result.viewingRoom.long).toEqual(null)
        expect(result.viewingRoom.short).toEqual(null)
      })
    })

    describe("long timeframe", () => {
      const query = gql`
        {
          viewingRoom(id: "example-viewing-room") {
            distanceToClose(short: false)
          }
        }
      `

      it("returns properly formatted distance string", async () => {
        const startAt = moment(fixedDate).subtract(1, "day").format()

        const cases = [
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

        cases.forEach(async ([timeShift, expectedResult]) => {
          const viewingRoomData = {
            start_at: startAt,
            end_at: moment()
              .add(...timeShift)
              .format(),
          }

          const context = {
            viewingRoomLoader: jest.fn().mockResolvedValue(viewingRoomData),
          }

          const result = await runQuery(query, context)
          expect(result.viewingRoom.distanceToClose).toEqual(expectedResult)
        })
      })
    })

    describe("short timeframe", () => {
      const query = gql`
        {
          viewingRoom(id: "example-viewing-room") {
            distanceToClose(short: true)
          }
        }
      `

      it("returns properly formatted distance string", async () => {
        const startAt = moment(fixedDate).subtract(1, "day").format()

        const cases = [
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

        cases.forEach(async ([timeShift, expectedResult]) => {
          const viewingRoomData = {
            start_at: startAt,
            end_at: moment()
              .add(...timeShift)
              .format(),
          }

          const context = {
            viewingRoomLoader: jest.fn().mockResolvedValue(viewingRoomData),
          }

          const result = await runQuery(query, context)
          expect(result.viewingRoom.distanceToClose).toEqual(expectedResult)
        })
      })
    })
  })

  describe("distanceToOpen", () => {
    const fixedDate = new Date("2024-09-26 10:00:00")

    beforeAll(() => {
      jest.useFakeTimers("modern").setSystemTime(fixedDate)
    })

    afterAll(() => {
      jest.useRealTimers()
    })

    describe("noop conditions", () => {
      const query = gql`
        {
          viewingRoom(id: "example-viewing-room") {
            long: distanceToOpen(short: false)
            short: distanceToOpen(short: true)
          }
        }
      `

      it("returns null if start date is missing", async () => {
        const endAt = moment(fixedDate).add(2, "days").format()

        const viewingRoomData = {
          start_at: null,
          end_at: endAt,
        }

        const context = {
          viewingRoomLoader: jest.fn().mockResolvedValue(viewingRoomData),
        }

        const result = await runQuery(query, context)

        expect(result.viewingRoom.long).toEqual(null)
        expect(result.viewingRoom.short).toEqual(null)
      })

      it("returns null if startAt date is in the past", async () => {
        const startAt = moment(fixedDate).subtract(2, "days").format()
        const endAt = moment(fixedDate).add(2, "days").format()

        const viewingRoomData = {
          start_at: startAt,
          end_at: endAt,
        }

        const context = {
          viewingRoomLoader: jest.fn().mockResolvedValue(viewingRoomData),
        }

        const result = await runQuery(query, context)
        expect(result.viewingRoom.long).toEqual(null)
        expect(result.viewingRoom.short).toEqual(null)
      })
    })

    describe("long timeframe", () => {
      const query = gql`
        {
          viewingRoom(id: "example-viewing-room") {
            distanceToOpen(short: false)
          }
        }
      `

      it("returns properly formatted distance string", async () => {
        const cases = [
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

        cases.forEach(async ([timeShift, expectedResult]) => {
          const viewingRoomData = {
            start_at: moment()
              .add(...timeShift)
              .format(),
            end_at: moment(fixedDate).add(3, "years").format(),
          }

          const context = {
            viewingRoomLoader: jest.fn().mockResolvedValue(viewingRoomData),
          }

          const result = await runQuery(query, context)
          expect(result.viewingRoom.distanceToOpen).toEqual(expectedResult)
        })
      })
    })

    describe("short timeframe", () => {
      const query = gql`
        {
          viewingRoom(id: "example-viewing-room") {
            distanceToOpen(short: true)
          }
        }
      `

      it("returns properly formatted distance string", async () => {
        const cases = [
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

        cases.forEach(async ([timeShift, expectedResult]) => {
          const viewingRoomData = {
            start_at: moment()
              .add(...timeShift)
              .format(),
            end_at: moment(fixedDate).add(3, "years").format(),
          }

          const context = {
            viewingRoomLoader: jest.fn().mockResolvedValue(viewingRoomData),
          }

          const result = await runQuery(query, context)
          expect(result.viewingRoom.distanceToOpen).toEqual(expectedResult)
        })
      })
    })
  })

  describe("exhibitionPeriod", () => {
    const query = gql`
      {
        viewingRoom(id: "example-viewing-room") {
          exhibitionPeriod
        }
      }
    `

    it("returns Invalid dates if dates are missing", async () => {
      const viewingRoomData = {
        start_at: null,
        end_at: null,
      }

      const context = {
        viewingRoomLoader: jest.fn().mockResolvedValue(viewingRoomData),
      }

      const result = await runQuery(query, context)
      expect(result.viewingRoom.exhibitionPeriod).toEqual(
        "Invalid date – Invalid date"
      )
    })

    it("returns formatted date range", async () => {
      const viewingRoomData = {
        start_at: moment("2021-09-01T00:00:00Z").format(),
        end_at: moment("2021-09-30T00:00:00Z").format(),
      }

      const context = {
        viewingRoomLoader: jest.fn().mockResolvedValue(viewingRoomData),
      }

      const result = await runQuery(query, context)
      expect(result.viewingRoom.exhibitionPeriod).toEqual(
        "September 1 – 30, 2021"
      )
    })
  })
})
