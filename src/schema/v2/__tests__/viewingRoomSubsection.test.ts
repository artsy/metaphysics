import { runQuery } from "schema/v2/test/utils"
import gql from "lib/gql"
import config from "config"

describe("ViewingRoomSubsection", () => {
  beforeAll(() => {
    config.USE_UNSTITCHED_VIEWING_ROOM_SCHEMA = true
  })

  afterAll(() => {
    config.USE_UNSTITCHED_VIEWING_ROOM_SCHEMA = false
  })

  const query = gql`
    {
      viewingRoom(id: "example-viewing-room") {
        subsections {
          __typename
          body
          caption
          image {
            __typename
            internalID
            height
            width
            imageURLs {
              __typename
              normalized
            }
          }
          internalID
          title
        }
      }
    }
  `

  it("fetches viewing room subsections", async () => {
    const viewingRoomSubsectionsData = [
      {
        body: "subsection body",
        caption: "subsection caption",
        image: {
          id: "example-image",
          original_height: 100,
          original_width: 100,
          image_urls: {
            normalized: "https://example.com/image.jpg",
          },
        },
        id: "example-subsection",
        title: "subsection title",
      },
      {
        body: "another subsection body",
        caption: "another subsection caption",
        image: {
          id: "another-example-image",
          original_height: 200,
          original_width: 200,
          image_urls: {
            normalized: "https://example.com/another-image.jpg",
          },
        },
        id: "another-example-subsection",
        title: "another subsection title",
      },
    ]

    const context = {
      viewingRoomLoader: jest.fn().mockResolvedValue({ id: "viewing-room-id" }),
      viewingRoomSubsectionsLoader: jest
        .fn()
        .mockResolvedValue(viewingRoomSubsectionsData),
    }

    const result = await runQuery(query, context)

    expect(result).toMatchInlineSnapshot(`
      {
        "viewingRoom": {
          "subsections": [
            {
              "__typename": "ViewingRoomSubsection",
              "body": "subsection body",
              "caption": "subsection caption",
              "image": {
                "__typename": "ARImage",
                "height": 100,
                "imageURLs": {
                  "__typename": "ImageURLs",
                  "normalized": "https://example.com/image.jpg",
                },
                "internalID": "example-image",
                "width": 100,
              },
              "internalID": "example-subsection",
              "title": "subsection title",
            },
            {
              "__typename": "ViewingRoomSubsection",
              "body": "another subsection body",
              "caption": "another subsection caption",
              "image": {
                "__typename": "ARImage",
                "height": 200,
                "imageURLs": {
                  "__typename": "ImageURLs",
                  "normalized": "https://example.com/another-image.jpg",
                },
                "internalID": "another-example-image",
                "width": 200,
              },
              "internalID": "another-example-subsection",
              "title": "another subsection title",
            },
          ],
        },
      }
    `)
  })
})
