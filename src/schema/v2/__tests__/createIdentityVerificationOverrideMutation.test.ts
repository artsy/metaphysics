import gql from "lib/gql"
import { runAuthenticatedQuery, runQuery } from "schema/v2/test/utils"

const mutation = gql`
  mutation {
    createIdentityVerificationOverride(
      input: {
        identityVerificationID: "123"
        state: "failed"
        reason: "testing"
      }
    ) {
      confirmationOrError {
        __typename
        ... on CreateIdentityVerificationMutationSuccess {
          identityVerificationOverride {
            userID
            reason
            newState
            oldState
          }
        }
        ... on CreateIdentityVerificationMutationFailure {
          mutationError {
            message
          }
        }
      }
    }
  }
`

describe("Create Identity Verification Override", () => {
  it("requires authentication", async () => {
    await expect(runQuery(mutation)).rejects.toThrow(
      "You need to be signed in to perform this action"
    )
  })

  describe("when successful", () => {
    it("returns the identity verification override", async () => {
      const successResponse = {
        userID: "123",
        reason: "testing",
        newState: "failed",
        oldState: "pending",
      }
      const context = {
        createIdentityVerificationOverrideLoader: () =>
          Promise.resolve(successResponse),
      }
      const data = await runAuthenticatedQuery(mutation, context)
      expect(data).toEqual({
        createIdentityVerificationOverride: {
          confirmationOrError: {
            __typename: "CreateIdentityVerificationMutationSuccess",
            identityVerificationOverride: {
              userID: "123",
              reason: "testing",
              newState: "failed",
              oldState: "pending",
            },
          },
        },
      })
    })
  })
})
