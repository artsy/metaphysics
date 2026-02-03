import gql from "lib/gql"
import { runAuthenticatedQuery } from "schema/v2/test/utils"
import { HTTPError } from "lib/HTTPError"

describe("publishViewingRoomMutation", () => {
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
      publishViewingRoom(input: { viewingRoomID: "viewing-room-id" }) {
        viewingRoomOrError {
          __typename
          ... on PublishViewingRoomSuccess {
            viewingRoom {
              internalID
            }
          }
          ... on PublishViewingRoomFailure {
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
        published: true,
      }
    )
  })

  it("returns a success type on successful publish", async () => {
    const result = await runAuthenticatedQuery(successMutation, context)

    expect(result.publishViewingRoom.viewingRoomOrError.__typename).toEqual(
      "PublishViewingRoomSuccess"
    )
  })

  it("returns a formatted error message on failure", async () => {
    const errorBody = {
      message: "Your viewing room must contain at least one published artwork.",
      type: "param_error",
      detail: {
        base: ["Your viewing room must contain at least one published artwork"],
      },
    }

    mockUpdateViewingRoomLoader.mockRejectedValue(
      new HTTPError(
        "https://stagingapi.artsy.net/api/v1/viewing_room/123 - Bad Request",
        400,
        errorBody
      )
    )

    const result = await runAuthenticatedQuery(successMutation, context)

    expect(result.publishViewingRoom.viewingRoomOrError.__typename).toEqual(
      "PublishViewingRoomFailure"
    )
    expect(
      result.publishViewingRoom.viewingRoomOrError.mutationError.message
    ).toEqual("Your viewing room must contain at least one published artwork.")
  })

  describe("backward compatibility", () => {
    const legacyMutation = gql`
      mutation {
        publishViewingRoom(input: { viewingRoomID: "viewing-room-id" }) {
          viewingRoom {
            internalID
          }
        }
      }
    `

    it("supports the legacy viewingRoom field on success", async () => {
      const result = await runAuthenticatedQuery(legacyMutation, context)

      expect(result.publishViewingRoom.viewingRoom).toBeTruthy()
      expect(result.publishViewingRoom.viewingRoom.internalID).toEqual(
        "viewing-room-id"
      )
    })

    it("returns null for legacy viewingRoom field on error", async () => {
      const errorBody = {
        message:
          "Your viewing room must contain at least one published artwork.",
        type: "param_error",
      }

      mockUpdateViewingRoomLoader.mockRejectedValue(
        new HTTPError(
          "https://stagingapi.artsy.net/api/v1/viewing_room/123 - Bad Request",
          400,
          errorBody
        )
      )

      const result = await runAuthenticatedQuery(legacyMutation, context)

      expect(result.publishViewingRoom.viewingRoom).toBeNull()
    })
  })
})
