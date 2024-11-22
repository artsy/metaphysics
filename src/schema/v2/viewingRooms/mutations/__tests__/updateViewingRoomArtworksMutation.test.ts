import config from "config"
import gql from "lib/gql"
import { runAuthenticatedQuery } from "schema/v2/test/utils"

describe("updateViewingRoomArtworksMutation", () => {
  const mockUpdateViewingRoomArtworksLoader = jest.fn()

  const context = {
    updateViewingRoomArtworksLoader: mockUpdateViewingRoomArtworksLoader,
  }

  beforeAll(() => {
    config.USE_UNSTITCHED_VIEWING_ROOM_SCHEMA = true
  })

  afterAll(() => {
    config.USE_UNSTITCHED_VIEWING_ROOM_SCHEMA = false
  })

  beforeEach(() => {
    mockUpdateViewingRoomArtworksLoader.mockResolvedValue(
      Promise.resolve({
        artwork_ids: ["artwork-1"],
      })
    )
  })

  afterEach(() => {
    mockUpdateViewingRoomArtworksLoader.mockReset()
  })

  const mutation = gql`
    mutation {
      updateViewingRoomArtworks(
        input: {
          viewingRoomID: "viewing-room-id"
          artworks: [
            { artworkID: "artwork-1", position: 0 }
            { artworkID: "artwork-2", delete: true }
          ]
        }
      ) {
        __typename

        artworkIDs
      }
    }
  `

  it("correctly calls the updateViewingRoomArtworksLoader", async () => {
    const result = await runAuthenticatedQuery(mutation, context)

    expect(mockUpdateViewingRoomArtworksLoader).toHaveBeenCalledWith(
      "viewing-room-id",
      {
        artworks: [
          { artwork_id: "artwork-1", position: 0 },
          { artwork_id: "artwork-2", delete: true },
        ],
      }
    )

    expect(result).toMatchInlineSnapshot(`
      {
        "updateViewingRoomArtworks": {
          "__typename": "updateViewingRoomArtworksPayload",
          "artworkIDs": [
            "artwork-1",
          ],
        },
      }
    `)
  })
})
