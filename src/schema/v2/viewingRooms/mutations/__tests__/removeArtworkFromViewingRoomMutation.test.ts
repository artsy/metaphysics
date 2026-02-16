import gql from "lib/gql"
import { runAuthenticatedQuery } from "schema/v2/test/utils"

describe("RemoveArtworkFromViewingRoomMutation", () => {
  const mutation = gql`
    mutation {
      removeArtworkFromViewingRoom(
        input: { viewingRoomID: "viewing-room-123", artworkId: "artwork-456" }
      ) {
        viewingRoomOrError {
          __typename
          ... on RemoveArtworkFromViewingRoomSuccess {
            viewingRoom {
              internalID
              title
            }
          }
          ... on RemoveArtworkFromViewingRoomFailure {
            mutationError {
              message
            }
          }
        }
      }
    }
  `

  it("removes an artwork from a viewing room", async () => {
    const mockViewingRoom = {
      id: "viewing-room-123",
      title: "Sample Viewing Room",
    }

    const context = {
      removeArtworkFromViewingRoomLoader: () =>
        Promise.resolve({ artwork_ids: [] }),
      viewingRoomLoader: () => Promise.resolve(mockViewingRoom),
    }

    const result = await runAuthenticatedQuery(mutation, context)

    expect(result).toEqual({
      removeArtworkFromViewingRoom: {
        viewingRoomOrError: {
          __typename: "RemoveArtworkFromViewingRoomSuccess",
          viewingRoom: {
            internalID: "viewing-room-123",
            title: "Sample Viewing Room",
          },
        },
      },
    })
  })

  it("returns mutation error on failure", async () => {
    const context = {
      removeArtworkFromViewingRoomLoader: () =>
        Promise.reject({
          body: { error: "Artwork Not Found", message: "Artwork Not Found" },
          statusCode: 404,
        }),
      viewingRoomLoader: () => Promise.resolve({}),
    }

    const result = await runAuthenticatedQuery(mutation, context)

    expect(
      result.removeArtworkFromViewingRoom.viewingRoomOrError.__typename
    ).toEqual("RemoveArtworkFromViewingRoomFailure")
    expect(
      result.removeArtworkFromViewingRoom.viewingRoomOrError.mutationError
        .message
    ).toEqual("Artwork Not Found")
  })
})
