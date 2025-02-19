import { runQuery } from "schema/v2/test/utils"
import gql from "lib/gql"

describe("ViewingRoomArtwork", () => {
  const query = gql`
    {
      viewingRoom(id: "example-viewing-room") {
        viewingRoomArtworks {
          __typename
          artworkID
          internalID
          published
        }
      }
    }
  `

  it("fetches viewing room artworks", async () => {
    const viewingRoomArtworksData = [
      {
        id: "example-viewing-room-artwork",
        artwork_id: "example-artwork",
        published: true,
      },
      {
        id: "example-viewing-room-artwork-2",
        artwork_id: "example-artwork-2",
        published: false,
      },
    ]

    const context = {
      viewingRoomLoader: jest.fn().mockResolvedValue({ id: "viewing-room-id" }),
      viewingRoomArtworksLoader: jest
        .fn()
        .mockResolvedValue(viewingRoomArtworksData),
    }

    const result = await runQuery(query, context)

    expect(result).toMatchInlineSnapshot(`
      {
        "viewingRoom": {
          "viewingRoomArtworks": [
            {
              "__typename": "ViewingRoomArtwork",
              "artworkID": "example-artwork",
              "internalID": "example-viewing-room-artwork",
              "published": true,
            },
            {
              "__typename": "ViewingRoomArtwork",
              "artworkID": "example-artwork-2",
              "internalID": "example-viewing-room-artwork-2",
              "published": false,
            },
          ],
        },
      }
    `)
  })
})
