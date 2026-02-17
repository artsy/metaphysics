import gql from "lib/gql"
import { runAuthenticatedQuery } from "schema/v2/test/utils"

describe("publishNavigationDraftMutation", () => {
  const mutationWithGroupID = gql`
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

  const mutationWithVersionID = gql`
    mutation {
      publishNavigationDraft(input: { versionID: "draft-version-123" }) {
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

  const mockPublishNavigationVersionLoader = jest.fn().mockResolvedValue({
    id: "version-published-456",
  })

  const context = {
    publishNavigationDraftLoader: mockPublishNavigationDraftLoader,
    publishNavigationVersionLoader: mockPublishNavigationVersionLoader,
  }

  describe("with groupID (deprecated)", () => {
    beforeEach(() => {
      jest.clearAllMocks()
    })

    it("returns a published navigation draft", async () => {
      const res = await runAuthenticatedQuery(mutationWithGroupID, context)

      expect(mockPublishNavigationDraftLoader).toHaveBeenCalledWith("artists")
      expect(mockPublishNavigationVersionLoader).not.toHaveBeenCalled()

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

  describe("with versionID (preferred)", () => {
    beforeEach(() => {
      jest.clearAllMocks()
    })

    it("returns a published navigation draft", async () => {
      const res = await runAuthenticatedQuery(mutationWithVersionID, context)

      expect(mockPublishNavigationVersionLoader).toHaveBeenCalledWith(
        "draft-version-123"
      )
      expect(mockPublishNavigationDraftLoader).not.toHaveBeenCalled()

      expect(res).toMatchInlineSnapshot(`
        {
          "publishNavigationDraft": {
            "navigationVersionOrError": {
              "navigationVersion": {
                "internalID": "version-published-456",
              },
            },
          },
        }
      `)
    })
  })
})
