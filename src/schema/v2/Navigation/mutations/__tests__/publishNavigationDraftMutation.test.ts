import gql from "lib/gql"
import { runAuthenticatedQuery } from "schema/v2/test/utils"

describe("publishNavigationDraftMutation", () => {
  const mutation = gql`
    mutation {
      publishNavigationDraft(input: { groupID: "artists" }) {
        navigationVersionOrError {
          ... on PublishNavigationDraftSuccess {
            navigationVersion {
              internalID
            }
          }
          ... on PublishNavigationDraftFailure {
            mutationError {
              message
            }
          }
        }
      }
    }
  `

  const mockPublishNavigationDraftLoader = jest.fn().mockResolvedValue({
    id: "artists-published-123",
  })

  const context = {
    publishNavigationDraftLoader: mockPublishNavigationDraftLoader,
  }

  it("returns a published navigation draft", async () => {
    const res = await runAuthenticatedQuery(mutation, context)

    expect(mockPublishNavigationDraftLoader).toHaveBeenCalledWith("artists")

    expect(res).toMatchInlineSnapshot(`
      {
        "publishNavigationDraft": {
          "navigationVersionOrError": {
            "navigationVersion": {
              "internalID": "artists-published-123",
            },
          },
        },
      }
    `)
  })
})
