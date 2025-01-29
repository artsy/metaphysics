import gql from "lib/gql"
import { runAuthenticatedQuery } from "schema/v2/test/utils"

describe("deleteViewingRoomMutation", () => {
  const mockDeleteViewingRoomLoader = jest.fn()

  const context = {
    deleteViewingRoomLoader: mockDeleteViewingRoomLoader,
  }

  const viewingRoomData = {
    id: "viewing-room-id",
  }

  beforeEach(() => {
    mockDeleteViewingRoomLoader.mockResolvedValue(
      Promise.resolve(viewingRoomData)
    )
  })

  afterEach(() => {
    mockDeleteViewingRoomLoader.mockReset()
  })

  const mutation = gql`
    mutation {
      deleteViewingRoom(input: { viewingRoomID: "viewing-room-id" }) {
        __typename
      }
    }
  `

  it("correctly calls the deleteViewingRoomLoader", async () => {
    await runAuthenticatedQuery(mutation, context)

    expect(mockDeleteViewingRoomLoader).toHaveBeenCalledWith("viewing-room-id")
  })
})
