import config from "config"
import gql from "lib/gql"
import { runAuthenticatedQuery } from "schema/v2/test/utils"

const describeOrSkip = config.USE_UNSTITCHED_MUTATIONS
  ? describe
  : describe.skip

describeOrSkip("transferMyCollectionMutation", () => {
  const mockTransferMyCollectionLoader = jest.fn()

  const context = {
    transferMyCollectionLoader: mockTransferMyCollectionLoader,
  }

  afterEach(() => {
    mockTransferMyCollectionLoader.mockReset()
  })

  it("transfers artworks by email and returns the count", async () => {
    mockTransferMyCollectionLoader.mockResolvedValue({ count: 5 })

    const mutation = gql`
      mutation {
        transferMyCollection(
          input: { emailFrom: "from@example.com", emailTo: "to@example.com" }
        ) {
          count
        }
      }
    `

    const result = await runAuthenticatedQuery(mutation, context)

    expect(mockTransferMyCollectionLoader).toHaveBeenCalledWith({
      email_from: "from@example.com",
      email_to: "to@example.com",
      id_from: undefined,
      id_to: undefined,
    })

    expect(result).toMatchInlineSnapshot(`
      {
        "transferMyCollection": {
          "count": 5,
        },
      }
    `)
  })

  it("transfers artworks by user ID", async () => {
    mockTransferMyCollectionLoader.mockResolvedValue({ count: 3 })

    const mutation = gql`
      mutation {
        transferMyCollection(
          input: { idFrom: "user-id-1", idTo: "user-id-2" }
        ) {
          count
        }
      }
    `

    const result = await runAuthenticatedQuery(mutation, context)

    expect(mockTransferMyCollectionLoader).toHaveBeenCalledWith({
      email_from: undefined,
      email_to: undefined,
      id_from: "user-id-1",
      id_to: "user-id-2",
    })

    expect(result).toMatchInlineSnapshot(`
      {
        "transferMyCollection": {
          "count": 3,
        },
      }
    `)
  })

  it("throws an error if user is not authenticated", async () => {
    const unauthenticatedContext = {
      transferMyCollectionLoader: undefined,
    }

    const mutation = gql`
      mutation {
        transferMyCollection(
          input: { emailFrom: "from@example.com", emailTo: "to@example.com" }
        ) {
          count
        }
      }
    `

    await expect(
      runAuthenticatedQuery(mutation, unauthenticatedContext)
    ).rejects.toThrow(
      "You need to be signed in as an admin to perform this action"
    )
  })
})
