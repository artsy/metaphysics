import { runAuthenticatedQuery, runQuery } from "schema/v2/test/utils"
import { HTTPError } from "lib/HTTPError"

const mutation = `
  mutation {
    updateEmailAccount(
      input: { id: "acc-1", captureSentMail: true, syncEnabled: false }
    ) {
      emailAccountOrError {
        ... on UpdateEmailAccountSuccess {
          emailAccount {
            internalID
            captureSentMail
            syncEnabled
          }
        }
        ... on UpdateEmailAccountFailure {
          mutationError {
            message
          }
        }
      }
    }
  }
`

describe("updateEmailAccount", () => {
  it("sends only the provided settings, snake-cased", async () => {
    const updateEmailAccountLoader = jest.fn().mockResolvedValue({
      id: "acc-1",
      capture_sent_mail: true,
      sync_enabled: false,
    })

    const result = await runAuthenticatedQuery(mutation, {
      updateEmailAccountLoader,
    })

    expect(updateEmailAccountLoader).toHaveBeenCalledWith("acc-1", {
      capture_sent_mail: true,
      sync_enabled: false,
    })
    expect(result.updateEmailAccount.emailAccountOrError.emailAccount).toEqual({
      internalID: "acc-1",
      captureSentMail: true,
      syncEnabled: false,
    })
  })

  it("leaves out settings that are explicitly null", async () => {
    const updateEmailAccountLoader = jest.fn().mockResolvedValue({
      id: "acc-1",
      sync_enabled: false,
    })

    await runAuthenticatedQuery(
      `
        mutation {
          updateEmailAccount(
            input: { id: "acc-1", syncEnabled: false, shareContentWithPartner: null }
          ) {
            emailAccountOrError {
              __typename
            }
          }
        }
      `,
      { updateEmailAccountLoader }
    )

    expect(updateEmailAccountLoader).toHaveBeenCalledWith("acc-1", {
      sync_enabled: false,
    })
  })

  it("returns failure on error", async () => {
    const error = new HTTPError("http://artsy.net - {}", 403, {
      error: "Unauthorized",
    })

    const result = await runAuthenticatedQuery(mutation, {
      updateEmailAccountLoader: jest.fn().mockRejectedValue(error),
    })

    expect(
      result.updateEmailAccount.emailAccountOrError.mutationError.message
    ).toBe("Unauthorized")
  })

  it("throws when signed out", async () => {
    await expect(runQuery(mutation, {})).rejects.toThrow(
      "You need to be signed in to perform this action"
    )
  })
})
