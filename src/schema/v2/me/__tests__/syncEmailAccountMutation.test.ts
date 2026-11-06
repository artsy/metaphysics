import { runAuthenticatedQuery, runQuery } from "schema/v2/test/utils"
import { HTTPError } from "lib/HTTPError"

const mutation = `
  mutation {
    syncEmailAccount(input: { id: "acc-1" }) {
      emailAccountOrError {
        ... on SyncEmailAccountSuccess {
          emailAccount {
            internalID
            status
          }
        }
        ... on SyncEmailAccountFailure {
          mutationError {
            message
          }
        }
      }
    }
  }
`

describe("syncEmailAccount", () => {
  it("calls the loader with the id and returns the account", async () => {
    const syncEmailAccountLoader = jest
      .fn()
      .mockResolvedValue({ id: "acc-1", status: "active" })

    const result = await runAuthenticatedQuery(mutation, {
      syncEmailAccountLoader,
    })

    expect(syncEmailAccountLoader).toHaveBeenCalledWith("acc-1")
    expect(result.syncEmailAccount.emailAccountOrError.emailAccount).toEqual({
      internalID: "acc-1",
      status: "ACTIVE",
    })
  })

  it("returns failure when the account is not active", async () => {
    const error = new HTTPError("http://artsy.net - {}", 400, {
      type: "param_error",
      message: "Account is not active",
      detail: {},
    })

    const result = await runAuthenticatedQuery(mutation, {
      syncEmailAccountLoader: jest.fn().mockRejectedValue(error),
    })

    expect(
      result.syncEmailAccount.emailAccountOrError.mutationError.message
    ).toBe("Account is not active")
  })

  it("throws when signed out", async () => {
    await expect(runQuery(mutation, {})).rejects.toThrow(
      "You need to be signed in to perform this action"
    )
  })
})
