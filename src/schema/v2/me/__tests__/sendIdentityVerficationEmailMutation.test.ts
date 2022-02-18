import gql from "lib/gql"
import { runAuthenticatedQuery, runQuery } from "schema/v2/test/utils"

const identityVerificationDetails = {
  state: "pending",
  user_id: "id-123",
}

const sendIdentityVerificationEmailMock = jest.fn().mockReturnValue(
  Promise.resolve({
    state: "pending",
    user_id: "id-123",
  })
)

const computeMutationInput = ({
  userID = "",
}: {
  userID?: string | null
} = {}): string => {
  const mutation = gql`
    mutation {
      sendIdentityVerificationEmail(
        input: {
          userID: ${JSON.stringify(userID)}
        }
      ) {
        confirmationOrError{
							... on IdentityVerificationEmailMutationSuccessType{
								identityVerificationEmail{
									internalID
									invitationExpiresAt
									state
									userID
								}
							}
							... on IdentityVerificationEmailMutationFailureType{
								mutationError{
									message
									error
									detail
								}
							}
						}
      }
    }
  `

  return mutation
}

const context = {
  sendIdentityVerificationEmail: sendIdentityVerificationEmailMock,
  sendIdentityVerificationEmailLoader: jest.fn(() =>
    Promise.resolve(identityVerificationDetails)
  ),
}

describe("Send identity verification email mutation", () => {
  const mutation = computeMutationInput({ userID: "id-123" })

  it("requires an access token", async () => {
    await expect(runQuery(mutation)).rejects.toThrow(
      "You need to be signed in to perform this action"
    )
  })

  fit("returns the state", async () => {
    const response = await runAuthenticatedQuery(mutation, context)

    console.log("CHECK:: ", response)

    // expect(response).toEqual({
    //   // sendIdentityVerificationEmail: {
    //   // confirmationOrError: {
    //   // identityVerificationEmail: {
    //   state: "pending",
    //   userID: "id-123",
    //   // },
    //   // },
    //   // },
    // })
  })

  it("throws an error if there is an unrecognizable error", async () => {
    const errorRootValue = {
      sendIdentityVerificationEmailLoader: () => {
        throw new Error("ETIMEOUT service unreachable")
      },
    }

    await expect(
      runAuthenticatedQuery(mutation, errorRootValue)
    ).rejects.toThrow("ETIMEOUT service unreachable")
  })
})
