import { runAuthenticatedQuery, runQuery } from "schema/v2/test/utils"
import { HTTPError } from "lib/HTTPError"

const mutation = `
  mutation {
    authorizeEmailAccount(
      input: {
        partnerId: "partner-1"
        provider: GMAIL
        redirectUri: "https://partners.artsy.net/callback"
      }
    ) {
      emailAccountOrError {
        ... on AuthorizeEmailAccountSuccess {
          authorizationUrl
        }
        ... on AuthorizeEmailAccountFailure {
          mutationError {
            message
          }
        }
      }
    }
  }
`

describe("authorizeEmailAccount", () => {
  it("calls the loader and returns the authorization url", async () => {
    const initiateEmailOAuthLoader = jest
      .fn()
      .mockResolvedValue({ authorization_url: "https://accounts.google.com/o" })

    const result = await runAuthenticatedQuery(mutation, {
      initiateEmailOAuthLoader,
    })

    expect(initiateEmailOAuthLoader).toHaveBeenCalledWith({
      partner_id: "partner-1",
      provider: "gmail",
      redirect_uri: "https://partners.artsy.net/callback",
    })
    expect(
      result.authorizeEmailAccount.emailAccountOrError.authorizationUrl
    ).toBe("https://accounts.google.com/o")
  })

  it("returns failure on error", async () => {
    const error = new HTTPError("http://artsy.net - {}", 400, {
      type: "param_error",
      message: "Something went wrong.",
      detail: {},
    })

    const result = await runAuthenticatedQuery(mutation, {
      initiateEmailOAuthLoader: jest.fn().mockRejectedValue(error),
    })

    expect(
      result.authorizeEmailAccount.emailAccountOrError.mutationError.message
    ).toBe("Something went wrong.")
  })

  it("throws when signed out", async () => {
    await expect(runQuery(mutation, {})).rejects.toThrow(
      "You need to be signed in to perform this action"
    )
  })
})
