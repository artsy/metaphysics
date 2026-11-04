import { runAuthenticatedQuery, runQuery } from "schema/v2/test/utils"
import { HTTPError } from "lib/HTTPError"

const mutation = `
  mutation {
    refreshEmailAccountWatch(input: { id: "acc-1" }) {
      emailAccountOrError {
        ... on RefreshEmailAccountWatchSuccess {
          emailAccount {
            internalID
            status
          }
        }
        ... on RefreshEmailAccountWatchFailure {
          mutationError {
            message
          }
        }
      }
    }
  }
`

describe("refreshEmailAccountWatch", () => {
  it("calls the loader with the id and returns the account", async () => {
    const refreshEmailAccountWatchLoader = jest
      .fn()
      .mockResolvedValue({ id: "acc-1", status: "active" })

    const result = await runAuthenticatedQuery(mutation, {
      refreshEmailAccountWatchLoader,
    })

    expect(refreshEmailAccountWatchLoader).toHaveBeenCalledWith("acc-1")
    expect(
      result.refreshEmailAccountWatch.emailAccountOrError.emailAccount
    ).toEqual({ internalID: "acc-1", status: "ACTIVE" })
  })

  it("returns failure when the account needs to be reconnected", async () => {
    const error = new HTTPError("http://artsy.net - {}", 400, {
      type: "param_error",
      message: "Account needs to be reconnected",
      detail: {},
    })

    const result = await runAuthenticatedQuery(mutation, {
      refreshEmailAccountWatchLoader: jest.fn().mockRejectedValue(error),
    })

    expect(
      result.refreshEmailAccountWatch.emailAccountOrError.mutationError.message
    ).toBe("Account needs to be reconnected")
  })

  it("throws when signed out", async () => {
    await expect(runQuery(mutation, {})).rejects.toThrow(
      "You need to be signed in to perform this action"
    )
  })
})
