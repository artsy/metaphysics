import { runQuery } from "schema/v2/test/utils"
import { StartIdentityVerificationGravityOutput } from "lib/loaders/loaders_without_authentication/gravity"

const mutation = `
mutation {
  startIdentityVerification(input: { identityVerificationId: "id-123"}) {
    startIdentityVerificationResponseOrError {
      ... on StartIdentityVerificationSuccess {
        identityVerificationFlowUrl
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
  it("returns the given identity verification ID and flow URL from Gravity", async () => {
    const gravityResponse: StartIdentityVerificationGravityOutput = {
      identity_verification_id: "idv-123",
      identity_verification_flow_url:
        "https://artsytest.netverify.com/something",
    }
    const context = {
      startIdentityVerificationLoader: () => Promise.resolve(gravityResponse),
    }

    const response = await runQuery(mutation, context)

    expect(response).toEqual({
      startIdentityVerification: {
        startIdentityVerificationResponseOrError: {
          identityVerificationId: "idv-123",
          identityVerificationFlowUrl:
            "https://artsytest.netverify.com/something",
        },
      },
    })
  })

  it("returns an Error when Gravity returns a recognizable error", async () => {
    const errorRootValue = {
      startIdentityVerificationLoader: () =>
        Promise.reject(
          new Error(
            `https://stagingapi.artsy.net/api/v1/identity_verification/idv-123/start - {"type":"other_error","message":"Identity verification not found","detail":"Your identity verification cannot be found"}`
          )
        ),
    }

    const response = await runQuery(mutation, errorRootValue)

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

  it("throws an error if there is an unrecognizable error", async () => {
    const errorRootValue = {
      startIdentityVerificationLoader: () => {
        throw new Error("ETIMEOUT service unreachable")
      },
    }

    await expect(runQuery(mutation, errorRootValue)).rejects.toThrow(
      "ETIMEOUT service unreachable"
    )
  })
})
