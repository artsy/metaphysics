import gql from "lib/gql"
import { runAuthenticatedQuery } from "schema/v2/test/utils"

describe("updateViewingRoomSubsectionsMutation", () => {
  const mockUpdateViewingRoomSubsectionsLoader = jest.fn()

  const context = {
    updateViewingRoomSubsectionsLoader: mockUpdateViewingRoomSubsectionsLoader,
  }

  beforeEach(() => {
    mockUpdateViewingRoomSubsectionsLoader.mockResolvedValue(
      Promise.resolve([
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
          image_url: "https://example.com/image.jpg",
          id: "example-subsection",
          title: "subsection title",
        },
      ])
    )
  })

  afterEach(() => {
    mockUpdateViewingRoomSubsectionsLoader.mockReset()
  })

  const mutation = gql`
    mutation {
      updateViewingRoomSubsections(
        input: {
          viewingRoomID: "viewing-room-id"
          subsections: [
            {
              attributes: {
                body: "subsection body"
                caption: "subsection caption"
                title: "subsection title"
              }
              image: { internalID: "example-image" }
            }
            { internalID: "subsection-to-delete-id", delete: true }
          ]
        }
      ) {
        __typename

        subsections {
          __typename

          body
          caption
          image {
            __typename
            width
            height
            internalID
            imageURLs {
              normalized
            }
          }
          imageURL
          internalID
          title
        }
      }
    }
  `

  it("correctly calls the updateViewingRoomSubsectionsLoader", async () => {
    const result = await runAuthenticatedQuery(mutation, context)

    expect(mockUpdateViewingRoomSubsectionsLoader).toHaveBeenCalledWith(
      "viewing-room-id",
      {
        subsections: [
          {
            ar_image_id: "example-image",
            attributes: {
              body: "subsection body",
              caption: "subsection caption",
              title: "subsection title",
            },
          },
          {
            attributes: {},
            delete: true,
            id: "subsection-to-delete-id",
          },
        ],
      }
    )

    expect(result).toMatchInlineSnapshot(`
      {
        "updateViewingRoomSubsections": {
          "__typename": "UpdateViewingRoomSubsectionsPayload",
          "subsections": [
            {
              "__typename": "ViewingRoomSubsection",
              "body": "subsection body",
              "caption": "subsection caption",
              "image": {
                "__typename": "ARImage",
                "height": 100,
                "imageURLs": {
                  "normalized": "https://example.com/image.jpg",
                },
                "internalID": "example-image",
                "width": 100,
              },
              "imageURL": "https://example.com/image.jpg",
              "internalID": "example-subsection",
              "title": "subsection title",
            },
          ],
        },
      }
    `)
  })
})
