import { runAuthenticatedQuery } from "schema/v2/test/utils"
import { ResolverContext } from "types/graphql"
import { HTTPError } from "lib/HTTPError"

const mutation = `
  mutation {
    completeInstagramOAuth(input: { code: "auth-code-123", state: "state-abc", redirectUri: "https://example.com/callback" }) {
      instagramAccountOrError {
        ... on CompleteInstagramOAuthSuccess {
          instagramAccount {
            internalID
            username
            status
          }
        }

        ... on CompleteInstagramOAuthFailure {
          mutationError {
            message
          }
        }
      }
    }
  }
`

describe("completeInstagramOAuth", () => {
  describe("valid query", () => {
    const mockGravityResponse = {
      id: "ig-1",
      _id: "ig-1",
      username: "acmegallery",
      account_name: "Acme Gallery",
      status: "active",
      partner_id: "partner-1",
    }

    let context: Partial<ResolverContext>

    beforeEach(() => {
      context = {
        completeInstagramOAuthLoader: jest
          .fn()
          .mockResolvedValue(mockGravityResponse),
      }
    })

    it("passes correct args to loader", async () => {
      await runAuthenticatedQuery(mutation, context)

      expect(
        context.completeInstagramOAuthLoader as jest.Mock
      ).toHaveBeenCalledWith({
        code: "auth-code-123",
        state: "state-abc",
        redirect_uri: "https://example.com/callback",
      })
    })

    it("returns instagramAccount on success", async () => {
      const result = await runAuthenticatedQuery(mutation, context)

      expect(result).toMatchInlineSnapshot(`
        {
          "completeInstagramOAuth": {
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
      completeInstagramOAuthLoader: jest.fn().mockRejectedValue(error),
    }

    const result = await runAuthenticatedQuery(mutation, context)

    expect(result).toMatchInlineSnapshot(`
      {
        "completeInstagramOAuth": {
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
