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

  describe("validation", () => {
    it("throws error when both groupID and versionID are provided", async () => {
      const mutationWithBoth = gql`
        mutation {
          publishNavigationDraft(
            input: { groupID: "artists", versionID: "version-123" }
          ) {
            navigationVersionOrError {
              ... on PublishNavigationDraftFailure {
                mutationError {
                  message
                }
              }
            }
          }
        }
      `

      await expect(
        runAuthenticatedQuery(mutationWithBoth, context)
      ).rejects.toThrow("Provide either groupID or versionID, but not both")
    })

    it("throws error when neither groupID nor versionID is provided", async () => {
      const mutationWithNeither = gql`
        mutation {
          publishNavigationDraft(input: {}) {
            navigationVersionOrError {
              ... on PublishNavigationDraftFailure {
                mutationError {
                  message
                }
              }
            }
          }
        }
      `

      await expect(
        runAuthenticatedQuery(mutationWithNeither, context)
      ).rejects.toThrow("Provide either groupID or versionID, but not both")
    })
  })

  describe("error handling", () => {
    it("returns error when publishing with groupID fails", async () => {
      const mockLoaderWithError = jest.fn().mockRejectedValue({
        statusCode: 400,
        body: {
          message: "Cannot publish draft version",
        },
      })

      const contextWithError = {
        ...context,
        publishNavigationDraftLoader: mockLoaderWithError,
      }

      const res = await runAuthenticatedQuery(
        mutationWithGroupID,
        contextWithError
      )

      expect(
        res.publishNavigationDraft.navigationVersionOrError
      ).toHaveProperty("mutationError")
    })

    it("returns error when publishing with versionID fails", async () => {
      const mockLoaderWithError = jest.fn().mockRejectedValue({
        statusCode: 400,
        body: {
          message: "Navigation version not found",
        },
      })

      const contextWithError = {
        ...context,
        publishNavigationVersionLoader: mockLoaderWithError,
      }

      const res = await runAuthenticatedQuery(
        mutationWithVersionID,
        contextWithError
      )

      expect(
        res.publishNavigationDraft.navigationVersionOrError
      ).toHaveProperty("mutationError")
    })
  })
})
