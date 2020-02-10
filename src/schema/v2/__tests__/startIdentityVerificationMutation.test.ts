import { runQuery, runAuthenticatedQuery } from "schema/v2/test/utils"

const mutation = `
mutation {
  startIdentityVerification(input: { identityVerificationId: "id-123"}) {
    startIdentityVerificationResponseOrError {
      ... on startIdentityVerificationSuccess {
        identityVerificationWizardUrl
        identityVerificationId
      }
    }
  }
}
`

describe("starting an identity verification", () => {
  it("requires an access token", () => {
    runQuery(mutation).catch(error => {
      expect(error.message).toEqual(
        "You need to be signed in to perform this action"
      )
    })
  })

  it("STUB: returns the given identity verification ID and a link to the staging auctions page", async () => {
    const response = await runAuthenticatedQuery(mutation)
    expect(response).toEqual({
      startIdentityVerification: {
        startIdentityVerificationResponseOrError: {
          identityVerificationId: "id-123",
          identityVerificationWizardUrl: "https://staging.artsy.net/auctions",
        },
      },
    })
  })
})
