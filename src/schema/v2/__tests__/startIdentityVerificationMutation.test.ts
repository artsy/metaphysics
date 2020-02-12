import { runQuery, runAuthenticatedQuery } from "schema/v2/test/utils"
import { StartIdentityVerificationGravityOutput } from "lib/loaders/loaders_with_authentication/gravity"

const mutation = `
mutation {
  startIdentityVerification(input: { identityVerificationId: "id-123"}) {
    startIdentityVerificationResponseOrError {
      ... on StartIdentityVerificationSuccess {
        identityVerificationWizardUrl
        identityVerificationId
      }
      ... on StartIdentityVerificationFailure {
        mutationError {
          type
          message
          detail
        }
      }
    }
  }
}
`

describe("starting an identity verification", () => {
  it("requires an access token", async () => {
    runQuery(mutation).catch(error => {
      expect(error.message).toEqual(
        "You need to be signed in to perform this action"
      )
    })
  })

  it("STUB: returns the given identity verification ID and a link to the staging auctions page", async () => {
    const gravityResponse: StartIdentityVerificationGravityOutput = {
      identity_verification_id: "idv-123",
      identity_verification_flow_url: "https://staging.artsy.net/auctions",
    }
    const context = {
      startIdentityVerificationLoader: () => Promise.resolve(gravityResponse),
    }

    const response = await runAuthenticatedQuery(mutation, context)

    expect(response).toEqual({
      startIdentityVerification: {
        startIdentityVerificationResponseOrError: {
          identityVerificationId: "idv-123",
          identityVerificationWizardUrl: "https://staging.artsy.net/auctions",
        },
      },
    })
  })

  it("STUB: returns an Error when Gravity returns a recognizable error", async () => {
    const errorRootValue = {
      startIdentityVerificationLoader: () =>
        Promise.reject(
          new Error(
            `https://stagingapi.artsy.net/api/v1/identity_verification/idv-123/start - {"type":"other_error","message":"Identity verification not found","detail":"Your identity verification cannot be found"}`
          )
        ),
    }

    const response = await runAuthenticatedQuery(mutation, errorRootValue)

    expect(response).toEqual({
      startIdentityVerification: {
        startIdentityVerificationResponseOrError: {
          mutationError: {
            type: "other_error",
            message: "Identity verification not found",
            detail: "Your identity verification cannot be found",
          },
        },
      },
    })
  })

  it("STUB: throws an error if there is an unrecognizable error", () => {
    const errorRootValue = {
      startIdentityVerificationLoader: () => {
        throw new Error("ETIMEOUT service unreachable")
      },
    }

    runAuthenticatedQuery(mutation, errorRootValue).catch(error => {
      expect(error.message).toEqual("ETIMEOUT service unreachable")
    })
  })
})
