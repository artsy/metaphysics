import { runAuthenticatedQuery } from "schema/v2/test/utils"
import { ResolverContext } from "types/graphql"
import { HTTPError } from "lib/HTTPError"

const mutation = `
  mutation {
    authorizeInstagramAccount(input: { partnerId: "partner-1", redirectUri: "https://example.com/callback" }) {
      instagramAccountOrError {
        ... on AuthorizeInstagramAccountSuccess {
          authorizationUrl
        }

        ... on AuthorizeInstagramAccountFailure {
          mutationError {
            message
          }
        }
      }
    }
  }
`

describe("authorizeInstagramAccount", () => {
  describe("valid query", () => {
    const mockGravityResponse = {
      authorization_url:
        "https://api.instagram.com/oauth/authorize?client_id=123&redirect_uri=https%3A%2F%2Fexample.com%2Fcallback&scope=user_profile&response_type=code",
    }

    let context: Partial<ResolverContext>

    beforeEach(() => {
      context = {
        initiateInstagramOAuthLoader: jest
          .fn()
          .mockResolvedValue(mockGravityResponse),
      }
    })

    it("passes correct args to Gravity", async () => {
      await runAuthenticatedQuery(mutation, context)

      expect(
        context.initiateInstagramOAuthLoader as jest.Mock
      ).toHaveBeenCalledWith({
        partner_id: "partner-1",
        redirect_uri: "https://example.com/callback",
      })
    })

    it("returns authorizationUrl in success response", async () => {
      const result = await runAuthenticatedQuery(mutation, context)

      expect(result).toMatchInlineSnapshot(`
        {
          "authorizeInstagramAccount": {
            "instagramAccountOrError": {
              "authorizationUrl": "https://api.instagram.com/oauth/authorize?client_id=123&redirect_uri=https%3A%2F%2Fexample.com%2Fcallback&scope=user_profile&response_type=code",
            },
          },
        }
      `)
    })
  })

  it("returns failure on Gravity error", async () => {
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
      initiateInstagramOAuthLoader: jest.fn().mockRejectedValue(error),
    }

    const result = await runAuthenticatedQuery(mutation, context)

    expect(result).toMatchInlineSnapshot(`
      {
        "authorizeInstagramAccount": {
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
