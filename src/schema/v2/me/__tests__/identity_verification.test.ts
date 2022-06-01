/* eslint-disable promise/always-return */
import { runAuthenticatedQuery } from "schema/v2/test/utils"
import { IdentityVerificationGravityResponse } from "../../identity_verification"

describe("IdentityVerification type", () => {
  it("returns the resolved identity verification", async () => {
    const gravityIdentityVerification: IdentityVerificationGravityResponse = {
      id: "123",
      state: "pending",
      invitation_expires_at:
        "Mon Feb 10 2020 00:00:00 GMT-0500 (Eastern Standard Time)",
      user_id: "user1",
    }

    const query = `
      {
        me {
          identityVerification(id: "123") {
            internalID
            state
            userID
            invitationExpiresAt
          }
        }
      }
    `

    const { me } = await runAuthenticatedQuery(query, {
      identityVerificationLoader: () =>
        Promise.resolve(gravityIdentityVerification),
    })

    expect(me).toEqual({
      identityVerification: {
        internalID: "123",
        state: "pending",
        userID: "user1",
        invitationExpiresAt:
          "Mon Feb 10 2020 00:00:00 GMT-0500 (Eastern Standard Time)",
      },
    })
  })
})
