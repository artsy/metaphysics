/* eslint-disable promise/always-return */
import { runAuthenticatedQuery } from "schema/v2/test/utils"

describe("IdentityVerification type", () => {
  it("returns the resolved identity verification", () => {
    const invitationExpiresAt = new Date(2020, 2, 10).toString()
    const gravityIdentityVerification: any /* IdentityVerificationGravityResponse */ = {
      id: "123",
      state: "pending",
      invitation_expires_at: invitationExpiresAt,
      user_id: "user1",
    }

    const query = `
      {
        me {
          identityVerification(id: "123") {
            id
            state
            userID
            invitationExpiresAt
          }
        }
      }
    `

    return runAuthenticatedQuery(query, {
      identityVerificationLoader: () =>
        Promise.resolve(gravityIdentityVerification),
    }).then(({ me }) => {
      expect(me).toEqual({
        identityVerification: {
          id: "123",
          state: "pending",
          userID: "user1",
          invitationExpiresAt,
        },
      })
    })
  })
})
