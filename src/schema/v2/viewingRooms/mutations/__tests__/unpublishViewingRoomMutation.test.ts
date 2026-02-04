import gql from "lib/gql"
import { runAuthenticatedQuery } from "schema/v2/test/utils"
import { HTTPError } from "lib/HTTPError"

describe("unpublishViewingRoomMutation", () => {
  const mockUpdateViewingRoomLoader = jest.fn()

  const context = {
    updateViewingRoomLoader: mockUpdateViewingRoomLoader,
  }

  const viewingRoomData = {
    id: "viewing-room-id",
  }

  beforeEach(() => {
    mockUpdateViewingRoomLoader.mockResolvedValue(
      Promise.resolve(viewingRoomData)
    )
  })

  afterEach(() => {
    mockUpdateViewingRoomLoader.mockReset()
  })

  const successMutation = gql`
    mutation {
      unpublishViewingRoom(input: { viewingRoomID: "viewing-room-id" }) {
        viewingRoomOrError {
          __typename
          ... on UnpublishViewingRoomSuccess {
            viewingRoom {
              internalID
            }
          }
          ... on UnpublishViewingRoomFailure {
            mutationError {
              message
            }
          }
        }
      }
    }
  `

  it("correctly calls the updateViewingRoomLoader", async () => {
    await runAuthenticatedQuery(successMutation, context)

    expect(mockUpdateViewingRoomLoader).toHaveBeenCalledWith(
      "viewing-room-id",
      {
        published: false,
      }
    )
  })

  it("returns a success type on successful unpublish", async () => {
    const result = await runAuthenticatedQuery(successMutation, context)

    expect(result.unpublishViewingRoom.viewingRoomOrError.__typename).toEqual(
      "UnpublishViewingRoomSuccess"
    )
  })

  it("returns a formatted error message on failure", async () => {
    const errorBody = {
      message: "Unable to unpublish viewing room.",
      type: "param_error",
    }

    mockUpdateViewingRoomLoader.mockRejectedValue(
      new HTTPError(
        "https://stagingapi.artsy.net/api/v1/viewing_room/123 - Bad Request",
        400,
        errorBody
      )
    )

    const result = await runAuthenticatedQuery(successMutation, context)

    expect(result.unpublishViewingRoom.viewingRoomOrError.__typename).toEqual(
      "UnpublishViewingRoomFailure"
    )
    expect(
      result.unpublishViewingRoom.viewingRoomOrError.mutationError.message
    ).toEqual("Unable to unpublish viewing room.")
  })
})
