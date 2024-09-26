import { runQuery } from "schema/v2/test/utils"
import gql from "lib/gql"

// TODO: skip until USE_UNSTITCHED_VIEWING_ROOM_SCHEMA is set to true and the schema is updated
describe.skip("ViewingRoom", () => {
  // TODO: fix issue with dates - distanceToClose and distanceToOpen are relative to the current date
  // It's easier to write tests if time is fixed

  // beforeAll(() => {
  //   jest.useFakeTimers("modern")
  //   jest.setSystemTime(new Date("2024-09-26 10:00:00"))
  // })

  // afterAll(() => {
  //   jest.useRealTimers()
  // })

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
          distanceToClose
          distanceToOpen(short: true)
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
          partnerArtworksConnection(first: 1) {
            totalCount
            edges {
              node {
                title
              }
            }
          }
          partnerID
          published
          pullQuote
          slug
          startAt
          status
          # subsections
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
        height: 100,
        width: 100,
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

      expect(partnerArtworksLoader).toHaveBeenCalledWith("partner-id", {
        page: 1,
        size: 1,
        total_count: true,
        viewing_room_id: "viewing-room-id",
      })

      expect(result).toMatchInlineSnapshot(`
        Object {
          "viewingRoom": Object {
            "artworkIDs": Array [
              "artwork1",
              "artwork2",
            ],
            "artworksConnection": Object {
              "edges": Array [
                Object {
                  "node": Object {
                    "title": "Artwork 1",
                  },
                },
              ],
              "totalCount": 2,
            },
            "body": "body",
            "distanceToClose": "1 day",
            "distanceToOpen": null,
            "endAt": "2024-09-27T10:00:00.375Z",
            "firstLiveAt": "2024-09-26T10:00:00.375Z",
            "heroImageURL": "hero://image.url",
            "href": "/viewing-room/slug",
            "image": Object {
              "height": "100",
              "imageURLs": Object {
                "normalized": "normalized://image.url",
              },
              "internalID": "image-internal-id",
              "width": "100",
            },
            "internalID": "viewing-room-id",
            "introStatement": "intro statement",
            "partner": Object {
              "name": "Partner Name",
            },
            "partnerArtworksConnection": Object {
              "edges": Array [
                Object {
                  "node": Object {
                    "title": "Partner Artwork 1",
                  },
                },
              ],
              "totalCount": 2,
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

  // TODO: describe("distanceToClose", () => {})
  // TODO: describe("distanceToOpen", () => {})
  // TODO: describe("exhibitionPeriod", () => {})
})
