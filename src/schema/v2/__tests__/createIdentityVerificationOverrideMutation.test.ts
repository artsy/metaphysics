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
      createIdentityVerificationOverrideResponseOrError {
        __typename
        ... on IdentityVerificationOverrideMutationSuccess {
          identityVerification {
            userID
            email
            overrides {
              userID
              reason
              newState
              oldState
            }
          }
        }
        ... on IdentityVerificationOverrideMutationFailure {
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
    it("returns an identity verification with overrides", async () => {
      const createIdentityVerificationOverrideLoaderResponse = {
        id: "123",
        user_id: "123",
        reason: "testing",
        new_state: "failed",
        old_state: "pending",
      }
      const identityVerificationLoaderResponse = {
        id: "123",
        email: "foo@bar.com",
        user_id: "123",
      }
      const identityVerificationOverridesLoaderResponse = [
        {
          user_id: "123",
          reason: "testing",
          new_state: "failed",
          old_state: "pending",
        },
      ]
      const context = {
        createIdentityVerificationOverrideLoader: () =>
          Promise.resolve(createIdentityVerificationOverrideLoaderResponse),
        identityVerificationLoader: () =>
          Promise.resolve(identityVerificationLoaderResponse),
        identityVerificationOverridesLoader: () =>
          Promise.resolve(identityVerificationOverridesLoaderResponse),
      }

      const data = await runAuthenticatedQuery(mutation, context)

      expect(data).toEqual({
        createIdentityVerificationOverride: {
          createIdentityVerificationOverrideResponseOrError: {
            __typename: "IdentityVerificationOverrideMutationSuccess",
            identityVerification: {
              email: "foo@bar.com",
              userID: "123",
              overrides: [
                {
                  userID: "123",
                  reason: "testing",
                  newState: "failed",
                  oldState: "pending",
                },
              ],
            },
          },
        },
      })
    })
  })

  describe("when failure", () => {
    it("return an error", async () => {
      const context = {
        createIdentityVerificationOverrideLoader: () =>
          Promise.reject(
            new Error(
              `https://stagingapi.artsy.net/api/v1/identity_verification/123/override?reason=testing&state=failed - {"type":"error","message":"Not Found"}`
            )
          ),
      }

      const response = await runAuthenticatedQuery(mutation, context)

      expect(response).toEqual({
        createIdentityVerificationOverride: {
          createIdentityVerificationOverrideResponseOrError: {
            __typename: "IdentityVerificationOverrideMutationFailure",
            mutationError: {
              message: "Not Found",
            },
          },
        },
      })
    })
  })
})
