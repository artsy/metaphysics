import { runAuthenticatedQuery } from "schema/v2/test/utils"
import { ResolverContext } from "types/graphql"
import { HTTPError } from "lib/HTTPError"

const mutation = `
  mutation {
    refreshInstagramAccount(input: { id: "ig-1" }) {
      instagramAccountOrError {
        ... on RefreshInstagramAccountSuccess {
          instagramAccount {
            internalID
            username
            status
          }
        }

        ... on RefreshInstagramAccountFailure {
          mutationError {
            message
          }
        }
      }
    }
  }
`

describe("refreshInstagramAccount", () => {
  describe("valid query", () => {
    const mockGravityResponse = {
      id: "ig-1",
      _id: "ig-1",
      username: "acmegallery",
      status: "active",
      partner_id: "partner-1",
    }

    let context: Partial<ResolverContext>

    beforeEach(() => {
      context = {
        refreshInstagramAccountLoader: jest
          .fn()
          .mockResolvedValue(mockGravityResponse),
      }
    })

    it("passes the id to the loader", async () => {
      await runAuthenticatedQuery(mutation, context)

      expect(
        context.refreshInstagramAccountLoader as jest.Mock
      ).toHaveBeenCalledWith("ig-1")
    })

    it("returns instagramAccount on success", async () => {
      const result = await runAuthenticatedQuery(mutation, context)

      expect(result).toMatchInlineSnapshot(`
        {
          "refreshInstagramAccount": {
            "instagramAccountOrError": {
              "instagramAccount": {
                "internalID": "ig-1",
                "status": "ACTIVE",
                "username": "acmegallery",
              },
            },
          },
        }
      `)
    })
  })

  it("returns failure on error", async () => {
    const gravityResponseBody = {
      type: "param_error",
      message: "Something went wrong.",
      detail: {},
    }
    const error = new HTTPError(
      "http://artsy.net - {}",
      400,
      gravityResponseBody
    )
    const context = {
      refreshInstagramAccountLoader: jest.fn().mockRejectedValue(error),
    }

    const result = await runAuthenticatedQuery(mutation, context)

    expect(result).toMatchInlineSnapshot(`
      {
        "refreshInstagramAccount": {
          "instagramAccountOrError": {
            "mutationError": {
              "message": "Something went wrong.",
            },
          },
        },
      }
    `)
  })
})
