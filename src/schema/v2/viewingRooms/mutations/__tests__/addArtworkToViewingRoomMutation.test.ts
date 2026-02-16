import gql from "lib/gql"
import { runAuthenticatedQuery } from "schema/v2/test/utils"

describe("AddArtworkToViewingRoomMutation", () => {
  const mutation = gql`
    mutation {
      addArtworkToViewingRoom(
        input: { viewingRoomID: "viewing-room-123", artworkId: "artwork-456" }
      ) {
        viewingRoomOrError {
          __typename
          ... on AddArtworkToViewingRoomSuccess {
            viewingRoom {
              internalID
              title
            }
          }
          ... on AddArtworkToViewingRoomFailure {
            mutationError {
              message
            }
          }
        }
      }
    }
  `

  it("adds an artwork to a viewing room", async () => {
    const mockViewingRoom = {
      id: "viewing-room-123",
      title: "Sample Viewing Room",
    }

    const context = {
      addArtworkToViewingRoomLoader: () => Promise.resolve({ artwork_ids: [] }),
      viewingRoomLoader: () => Promise.resolve(mockViewingRoom),
    }

    const result = await runAuthenticatedQuery(mutation, context)

    expect(result).toEqual({
      addArtworkToViewingRoom: {
        viewingRoomOrError: {
          __typename: "AddArtworkToViewingRoomSuccess",
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
      addArtworkToViewingRoomLoader: () =>
        Promise.reject({
          body: {
            error: "Artwork Already Included",
            message: "Artwork Already Included",
          },
          statusCode: 400,
        }),
      viewingRoomLoader: () => Promise.resolve({}),
    }

    const result = await runAuthenticatedQuery(mutation, context)

    expect(
      result.addArtworkToViewingRoom.viewingRoomOrError.__typename
    ).toEqual("AddArtworkToViewingRoomFailure")
    expect(
      result.addArtworkToViewingRoom.viewingRoomOrError.mutationError.message
    ).toEqual("Artwork Already Included")
  })
})
