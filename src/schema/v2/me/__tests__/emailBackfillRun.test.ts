import { runAuthenticatedQuery } from "schema/v2/test/utils"
import { HTTPError } from "lib/HTTPError"

const query = `
  {
    emailBackfillRun(emailAccountId: "acc-1") {
      internalID
      status
      queuedMessages
      capped
    }
  }
`

describe("emailBackfillRun", () => {
  it("returns the latest run", async () => {
    const emailBackfillRunLoader = jest.fn().mockResolvedValue({
      id: "run-1",
      status: "completed",
      queued_messages: 12,
      capped: false,
    })

    const result = await runAuthenticatedQuery(query, {
      emailBackfillRunLoader,
    })

    expect(emailBackfillRunLoader).toHaveBeenCalledWith("acc-1")
    expect(result.emailBackfillRun).toEqual({
      internalID: "run-1",
      status: "COMPLETED",
      queuedMessages: 12,
      capped: false,
    })
  })

  it("returns null when no backfill was requested", async () => {
    const error = new HTTPError("http://artsy.net - {}", 404, {})

    const result = await runAuthenticatedQuery(query, {
      emailBackfillRunLoader: jest.fn().mockRejectedValue(error),
    })

    expect(result.emailBackfillRun).toBeNull()
  })
})
