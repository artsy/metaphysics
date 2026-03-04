import { runAuthenticatedQuery } from "schema/v2/test/utils"
import { ResolverContext } from "types/graphql"
import { HTTPError } from "lib/HTTPError"

const mutation = `
  mutation {
    authorizeMailchimpAccount(input: { partnerId: "partner-1", redirectUri: "https://example.com/callback" }) {
      mailchimpAccountOrError {
        ... on AuthorizeMailchimpAccountSuccess {
          authorizationUrl
        }

        ... on AuthorizeMailchimpAccountFailure {
          mutationError {
            message
          }
        }
      }
    }
  }
`

describe("authorizeMailchimpAccount", () => {
  describe("valid query", () => {
    const mockGravityResponse = {
      authorization_url:
        "https://login.mailchimp.com/oauth2/authorize?response_type=code&client_id=123&redirect_uri=https%3A%2F%2Fexample.com%2Fcallback",
    }

    let context: Partial<ResolverContext>

    beforeEach(() => {
      context = {
        initiateMailchimpOAuthLoader: jest
          .fn()
          .mockResolvedValue(mockGravityResponse),
      }
    })

    it("passes correct args to Gravity", async () => {
      await runAuthenticatedQuery(mutation, context)

      expect(
        context.initiateMailchimpOAuthLoader as jest.Mock
      ).toHaveBeenCalledWith({
        partner_id: "partner-1",
        redirect_uri: "https://example.com/callback",
      })
    })

    it("returns authorizationUrl in success response", async () => {
      const result = await runAuthenticatedQuery(mutation, context)

      expect(result).toMatchInlineSnapshot(`
        {
          "authorizeMailchimpAccount": {
            "mailchimpAccountOrError": {
              "authorizationUrl": "https://login.mailchimp.com/oauth2/authorize?response_type=code&client_id=123&redirect_uri=https%3A%2F%2Fexample.com%2Fcallback",
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
      initiateMailchimpOAuthLoader: jest.fn().mockRejectedValue(error),
    }

    const result = await runAuthenticatedQuery(mutation, context)

    expect(result).toMatchInlineSnapshot(`
      {
        "authorizeMailchimpAccount": {
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
