import { runAuthenticatedQuery } from "schema/v2/test/utils"
import { ResolverContext } from "types/graphql"
import { HTTPError } from "lib/HTTPError"

const mutation = `
  mutation {
    completeMailchimpOAuth(input: { code: "auth-code-123", state: "state-abc", redirectUri: "https://example.com/callback" }) {
      mailchimpAccountOrError {
        ... on CompleteMailchimpOAuthSuccess {
          mailchimpAccount {
            internalID
            status
          }
        }

        ... on CompleteMailchimpOAuthFailure {
          mutationError {
            message
          }
        }
      }
    }
  }
`

describe("completeMailchimpOAuth", () => {
  describe("valid query", () => {
    const mockGravityResponse = {
      id: "mc-1",
      _id: "mc-1",
      name: "Acme",
      status: "active",
      partner_id: "partner-1",
    }

    let context: Partial<ResolverContext>

    beforeEach(() => {
      context = {
        completeMailchimpOAuthLoader: jest
          .fn()
          .mockResolvedValue(mockGravityResponse),
      }
    })

    it("passes correct args to loader", async () => {
      await runAuthenticatedQuery(mutation, context)

      expect(
        context.completeMailchimpOAuthLoader as jest.Mock
      ).toHaveBeenCalledWith({
        code: "auth-code-123",
        state: "state-abc",
        redirect_uri: "https://example.com/callback",
      })
    })

    it("returns mailchimpAccount on success", async () => {
      const result = await runAuthenticatedQuery(mutation, context)

      expect(result).toMatchInlineSnapshot(`
        {
          "completeMailchimpOAuth": {
            "mailchimpAccountOrError": {
              "mailchimpAccount": {
                "internalID": "mc-1",
                "status": "ACTIVE",
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
      completeMailchimpOAuthLoader: jest.fn().mockRejectedValue(error),
    }

    const result = await runAuthenticatedQuery(mutation, context)

    expect(result).toMatchInlineSnapshot(`
      {
        "completeMailchimpOAuth": {
          "mailchimpAccountOrError": {
            "mutationError": {
              "message": "Something went wrong.",
            },
          },
        },
      }
    `)
  })
})
