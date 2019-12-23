/* eslint-disable promise/always-return */
import { runAuthenticatedQuery } from "schema/v2/test/utils"

describe("creating an account request", () => {
  const accountRequest = {
    id: "mongo id",
    notes: "Catty message",
  }

  const query = `
  mutation {
    createAccountRequest(input: {action: "user_data", notes: "Catty message", userID: "catty id"}) {
      accountRequestOrError {
        ... on CreateAccountRequestMutationSuccess {
          accountRequest {
            notes
          }
        }
        ... on CreateAccountRequestMutationFailure {
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

  const context = {
    createAccountRequestLoader: () => Promise.resolve(accountRequest),
  }

  it("creates an account request", async () => {
    const data = await runAuthenticatedQuery(query, context)
    expect(data).toEqual({
      createAccountRequest: {
        accountRequestOrError: { accountRequest: { notes: "Catty message" } },
      },
    })
  })
})
