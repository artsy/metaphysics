import gql from "lib/gql"
import { runAuthenticatedQuery } from "schema/v2/test/utils"

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

  const mutation = gql`
    mutation {
      unpublishViewingRoom(input: { viewingRoomID: "viewing-room-id" }) {
        __typename
      }
    }
  `

  it("correctly calls the updateViewingRoomLoader", async () => {
    await runAuthenticatedQuery(mutation, context)

    expect(mockUpdateViewingRoomLoader).toHaveBeenCalledWith(
      "viewing-room-id",
      {
        published: false,
      }
    )
  })
})
