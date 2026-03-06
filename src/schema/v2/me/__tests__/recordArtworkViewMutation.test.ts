import gql from "lib/gql"
import { runAuthenticatedQuery } from "schema/v2/test/utils"

describe("recordArtworkViewMutation", () => {
  const mockRecordArtworkViewLoader = jest.fn()

  const context = {
    recordArtworkViewLoader: mockRecordArtworkViewLoader,
  }

  beforeEach(() => {
    mockRecordArtworkViewLoader.mockResolvedValue(true)
  })

  afterEach(() => {
    mockRecordArtworkViewLoader.mockReset()
  })

  it("records an artwork view", async () => {
    const mutation = gql`
      mutation {
        recordArtworkView(input: { artwork_id: "artwork-id" }) {
          artworkId
        }
      }
    `

    const result = await runAuthenticatedQuery(mutation, context)

    expect(mockRecordArtworkViewLoader).toHaveBeenCalledWith({
      artwork_id: "artwork-id",
    })

    expect(result).toMatchInlineSnapshot(`
      {
        "recordArtworkView": {
          "artworkId": "artwork-id",
        },
      }
    `)
  })

  it("throws an error if user is not authenticated", async () => {
    const unauthenticatedContext = {
      recordArtworkViewLoader: undefined,
    }

    const mutation = gql`
      mutation {
        recordArtworkView(input: { artwork_id: "artwork-id" }) {
          artworkId
        }
      }
    `

    await expect(
      runAuthenticatedQuery(mutation, unauthenticatedContext)
    ).rejects.toThrow("You need to be signed in to perform this action")
  })
})
