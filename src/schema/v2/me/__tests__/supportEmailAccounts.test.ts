import { runAuthenticatedQuery } from "schema/v2/test/utils"

const query = `
  {
    supportEmailAccounts(userId: "user-1") {
      internalID
      partnerId
      emailAddress
      status
      syncEnabled
    }
  }
`

describe("supportEmailAccounts", () => {
  it("returns the accounts of the user", async () => {
    const supportEmailAccountsLoader = jest.fn().mockResolvedValue([
      {
        id: "acc-1",
        partner_id: "partner-1",
        user_id: "user-1",
        email_address: "a@example.com",
        status: "active",
        sync_enabled: true,
      },
    ])

    const result = await runAuthenticatedQuery(query, {
      supportEmailAccountsLoader,
    })

    expect(supportEmailAccountsLoader).toHaveBeenCalledWith({
      user_id: "user-1",
    })
    expect(result.supportEmailAccounts).toEqual([
      {
        internalID: "acc-1",
        partnerId: "partner-1",
        emailAddress: "a@example.com",
        status: "ACTIVE",
        syncEnabled: true,
      },
    ])
  })
})
