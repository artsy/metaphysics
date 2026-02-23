import gql from "lib/gql"
import { runAuthenticatedQuery } from "schema/v2/test/utils"

describe("discardNavigationDraftMutation", () => {
  const mutation = gql`
    mutation {
      discardNavigationDraft(input: { versionID: "draft-version-123" }) {
        discardNavigationDraftResponseOrError {
          ... on DiscardNavigationDraftSuccess {
            success
          }
          ... on DiscardNavigationDraftFailure {
            mutationError {
              message
            }
          }
        }
      }
    }
  `

  const mockDiscardNavigationDraftVersionLoader = jest
    .fn()
    .mockResolvedValue(null)

  const context = {
    discardNavigationDraftVersionLoader: mockDiscardNavigationDraftVersionLoader,
  }

  it("discards a draft navigation version", async () => {
    const res = await runAuthenticatedQuery(mutation, context)

    expect(mockDiscardNavigationDraftVersionLoader).toHaveBeenCalledWith(
      "draft-version-123"
    )

    expect(res).toMatchInlineSnapshot(`
      {
        "discardNavigationDraft": {
          "discardNavigationDraftResponseOrError": {
            "success": true,
          },
        },
      }
    `)
  })

  it("returns an error when the draft version cannot be deleted", async () => {
    const mockLoaderWithError = jest.fn().mockRejectedValue({
      statusCode: 400,
      body: {
        message: "Cannot delete published version",
      },
    })

    const contextWithError = {
      discardNavigationDraftVersionLoader: mockLoaderWithError,
    }

    const res = await runAuthenticatedQuery(mutation, contextWithError)

    expect(
      res.discardNavigationDraft.discardNavigationDraftResponseOrError
    ).toHaveProperty("mutationError")
  })
})
