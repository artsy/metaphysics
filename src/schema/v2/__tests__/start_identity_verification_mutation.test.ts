import { runQuery } from "schema/v2/test/utils"

const mutation = `
mutation {
  startIdentityVerification(input: { identityVerificationID: "id-123"}) {
    startIdentityVerificationResponseOrError {
      identity_verification_wizard_url
      identity_verification_id
    }
  }
}
`

describe("starting an identity verification", () => {
  it("requires an access token", () => {
    return runQuery(mutation).catch(error => {
      expect(error.message).toEqual(
        "You need to be signed in to perform this action"
      )
    })
  })

  xit("returns an IdentityVerificationOrError", () => {})
})
