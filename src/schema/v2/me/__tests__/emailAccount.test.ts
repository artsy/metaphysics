import gql from "lib/gql"
import { runAuthenticatedQuery } from "schema/v2/test/utils"

describe("me.emailAccounts", () => {
  const query = gql`
    {
      me {
        emailAccounts(partnerId: "partner-1") {
          internalID
          partnerId
          provider
          emailAddress
          status
          scopes
          syncEnabled
          shareContentWithPartner
          captureSentMail
          lastError
          lapsedAt
        }
      }
    }
  `

  it("returns the user's accounts for the partner", async () => {
    const emailAccountsLoader = jest.fn().mockResolvedValue({
      body: [
        {
          id: "acc-1",
          partner_id: "partner-1",
          user_id: "user-1",
          provider: "gmail",
          email_address: "gallery@example.com",
          status: "active",
          scopes: ["openid", "email"],
          sync_enabled: true,
          share_content_with_partner: false,
          capture_sent_mail: false,
          last_error: null,
          lapsed_at: null,
        },
      ],
    })

    const result = await runAuthenticatedQuery(query, {
      meLoader: () => Promise.resolve({}),
      emailAccountsLoader,
    })

    expect(emailAccountsLoader).toHaveBeenCalledWith({
      partner_id: "partner-1",
    })
    expect(result.me.emailAccounts).toEqual([
      {
        internalID: "acc-1",
        partnerId: "partner-1",
        provider: "GMAIL",
        emailAddress: "gallery@example.com",
        status: "ACTIVE",
        scopes: ["openid", "email"],
        syncEnabled: true,
        shareContentWithPartner: false,
        captureSentMail: false,
        lastError: null,
        lapsedAt: null,
      },
    ])
  })
})
