import { runAuthenticatedQuery, runQuery } from "schema/v2/test/utils"
import { HTTPError } from "lib/HTTPError"

const mutation = `
  mutation {
    requestEmailBackfill(
      input: { id: "acc-1", backfillSince: "2025-01-01T00:00:00Z" }
    ) {
      emailBackfillRunOrError {
        ... on RequestEmailBackfillSuccess {
          emailBackfillRun {
            internalID
            status
            queuedMessages
          }
        }
        ... on RequestEmailBackfillFailure {
          mutationError {
            message
          }
        }
      }
    }
  }
`

describe("requestEmailBackfill", () => {
  it("calls the loader and returns the run", async () => {
    const requestEmailBackfillLoader = jest.fn().mockResolvedValue({
      id: "run-1",
      status: "processing",
      queued_messages: 0,
    })

    const result = await runAuthenticatedQuery(mutation, {
      requestEmailBackfillLoader,
    })

    expect(requestEmailBackfillLoader).toHaveBeenCalledWith("acc-1", {
      backfill_since: "2025-01-01T00:00:00Z",
    })
    expect(
      result.requestEmailBackfill.emailBackfillRunOrError.emailBackfillRun
    ).toEqual({ internalID: "run-1", status: "PROCESSING", queuedMessages: 0 })
  })

  it("returns failure when a backfill is already running", async () => {
    const error = new HTTPError("http://artsy.net - {}", 409, {
      type: "error",
      message: "A backfill is already running for this account",
      detail: {},
    })

    const result = await runAuthenticatedQuery(mutation, {
      requestEmailBackfillLoader: jest.fn().mockRejectedValue(error),
    })

    expect(
      result.requestEmailBackfill.emailBackfillRunOrError.mutationError.message
    ).toBe("A backfill is already running for this account")
  })

  it("throws when signed out", async () => {
    await expect(runQuery(mutation, {})).rejects.toThrow(
      "You need to be signed in to perform this action"
    )
  })
})
