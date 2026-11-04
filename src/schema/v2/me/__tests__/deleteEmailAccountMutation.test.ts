import { runAuthenticatedQuery, runQuery } from "schema/v2/test/utils"
import { HTTPError } from "lib/HTTPError"

const mutation = `
  mutation {
    deleteEmailAccount(input: { id: "acc-1" }) {
      emailAccountOrError {
        ... on DeleteEmailAccountSuccess {
          success
        }
        ... on DeleteEmailAccountFailure {
          mutationError {
            message
          }
        }
      }
    }
  }
`

describe("deleteEmailAccount", () => {
  it("calls the loader with the id and returns success", async () => {
    const deleteEmailAccountLoader = jest
      .fn()
      .mockResolvedValue({ success: true })

    const result = await runAuthenticatedQuery(mutation, {
      deleteEmailAccountLoader,
    })

    expect(deleteEmailAccountLoader).toHaveBeenCalledWith("acc-1")
    expect(result.deleteEmailAccount.emailAccountOrError.success).toBe(true)
  })

  it("returns failure on error", async () => {
    const error = new HTTPError("http://artsy.net - {}", 400, {
      type: "param_error",
      message: "Something went wrong.",
      detail: {},
    })

    const result = await runAuthenticatedQuery(mutation, {
      deleteEmailAccountLoader: jest.fn().mockRejectedValue(error),
    })

    expect(
      result.deleteEmailAccount.emailAccountOrError.mutationError.message
    ).toBe("Something went wrong.")
  })

  it("throws when signed out", async () => {
    await expect(runQuery(mutation, {})).rejects.toThrow(
      "You need to be signed in to perform this action"
    )
  })
})
