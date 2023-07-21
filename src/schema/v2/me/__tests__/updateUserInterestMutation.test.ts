import gql from "lib/gql"
import { runAuthenticatedQuery } from "schema/v2/test/utils"

describe("updateUserInterestMutation", () => {
  const userInterest = {
    id: "id",
    private: false,
  }

  const mockMeUpdateUserInterestLoader = jest.fn()

  const context = {
    meUpdateUserInterestLoader: mockMeUpdateUserInterestLoader,
  }

  beforeEach(() => {
    mockMeUpdateUserInterestLoader.mockResolvedValue(
      Promise.resolve(userInterest)
    )
  })

  afterEach(() => {
    mockMeUpdateUserInterestLoader.mockReset()
  })

  it("updates the user interest using the provided input", async () => {
    const mutation = gql`
      mutation {
        updateUserInterest(
          input: { id: "id", private: false, clientMutationId: "1234" }
        ) {
          userInterestOrError {
            ... on UpdateUserInterestSuccess {
              userInterest {
                private
              }
            }
          }
        }
      }
    `

    await runAuthenticatedQuery(mutation, context)

    expect(mockMeUpdateUserInterestLoader).toHaveBeenCalledWith("id", {
      private: false,
    })
  })
})
