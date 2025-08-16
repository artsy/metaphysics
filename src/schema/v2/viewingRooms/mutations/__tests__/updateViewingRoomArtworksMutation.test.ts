import gql from "lib/gql"
import { runAuthenticatedQuery } from "schema/v2/test/utils"

describe("updateViewingRoomArtworksMutation", () => {
  const mockUpdateViewingRoomArtworksLoader = jest.fn()

  const context = {
    updateViewingRoomArtworksLoader: mockUpdateViewingRoomArtworksLoader,
  }

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
            { artworkID: "artwork-1" }
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
          { artwork_id: "artwork-1" },
          { artwork_id: "artwork-2", delete: true },
        ],
      }
    )

    expect(result).toMatchInlineSnapshot(`
      {
        "updateViewingRoomArtworks": {
          "__typename": "UpdateViewingRoomArtworksPayload",
          "artworkIDs": [
            "artwork-1",
          ],
        },
      }
    `)
  })
})
