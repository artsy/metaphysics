import gql from "lib/gql"
import { runAuthenticatedQuery } from "schema/v2/test/utils"

describe("createNavigationDraftMutation", () => {
  const mutation = gql`
    mutation {
      createNavigationDraft(input: { groupID: "artists" }) {
        navigationVersionOrError {
          ... on CreateNavigationDraftSuccess {
            navigationVersion {
              internalID
            }
          }
          ... on CreateNavigationDraftFailure {
            mutationError {
              message
            }
          }
        }
      }
    }
  `

  const mockCreateNavigationDraftLoader = jest.fn().mockResolvedValue({
    id: "artists-draft-123",
  })

  const context = {
    createNavigationDraftLoader: mockCreateNavigationDraftLoader,
  }

  it("returns a created navigation draft", async () => {
    const res = await runAuthenticatedQuery(mutation, context)

    expect(res).toMatchInlineSnapshot(`
      {
        "createNavigationDraft": {
          "navigationVersionOrError": {
            "navigationVersion": {
              "internalID": "artists-draft-123",
            },
          },
        },
      }
    `)
  })

  it("calls the loader with seedFromVersionID when provided", async () => {
    const mutationWithSeed = gql`
      mutation {
        createNavigationDraft(
          input: { groupID: "artists", seedFromVersionID: "version-123" }
        ) {
          navigationVersionOrError {
            ... on CreateNavigationDraftSuccess {
              navigationVersion {
                internalID
              }
            }
          }
        }
      }
    `

    await runAuthenticatedQuery(mutationWithSeed, context)

    expect(mockCreateNavigationDraftLoader).toHaveBeenCalledWith("artists", {
      seed_from_version_id: "version-123",
    })
  })
})
