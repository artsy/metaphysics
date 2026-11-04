import { runAuthenticatedQuery, runQuery } from "schema/v2/test/utils"
import { HTTPError } from "lib/HTTPError"

const mutation = `
  mutation {
    completeEmailOAuth(
      input: {
        code: "code-1"
        state: "state-1"
        redirectUri: "https://partners.artsy.net/callback"
      }
    ) {
      emailAccountOrError {
        ... on CompleteEmailOAuthSuccess {
          emailAccount {
            internalID
            emailAddress
            status
          }
        }
        ... on CompleteEmailOAuthFailure {
          mutationError {
            message
          }
        }
      }
    }
  }
`

describe("completeEmailOAuth", () => {
  it("calls the loader and returns the connected account", async () => {
    const completeEmailOAuthLoader = jest.fn().mockResolvedValue({
      id: "acc-1",
      email_address: "gallery@example.com",
      status: "active",
    })

    const result = await runAuthenticatedQuery(mutation, {
      completeEmailOAuthLoader,
    })

    expect(completeEmailOAuthLoader).toHaveBeenCalledWith({
      code: "code-1",
      state: "state-1",
      redirect_uri: "https://partners.artsy.net/callback",
    })
    expect(result.completeEmailOAuth.emailAccountOrError.emailAccount).toEqual({
      internalID: "acc-1",
      emailAddress: "gallery@example.com",
      status: "ACTIVE",
    })
  })

  it("returns failure on error", async () => {
    const error = new HTTPError("http://artsy.net - {}", 400, {
      type: "param_error",
      message: "Invalid state parameter",
      detail: {},
    })

    const result = await runAuthenticatedQuery(mutation, {
      completeEmailOAuthLoader: jest.fn().mockRejectedValue(error),
    })

    expect(
      result.completeEmailOAuth.emailAccountOrError.mutationError.message
    ).toBe("Invalid state parameter")
  })

  it("throws when signed out", async () => {
    await expect(runQuery(mutation, {})).rejects.toThrow(
      "You need to be signed in to perform this action"
    )
  })
})
