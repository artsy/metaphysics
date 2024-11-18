import gql from "lib/gql"
import { runAuthenticatedQuery } from "schema/v2/test/utils"

describe("updateUserInterestMutation", () => {
  const mockMeUpdateUserInterestLoader = jest.fn()

  const context = {
    meUpdateUserInterestLoader: mockMeUpdateUserInterestLoader,
  }

  it("updates the user interest using the provided input", async () => {
    mockMeUpdateUserInterestLoader.mockResolvedValueOnce(
      Promise.resolve({ id: "id-1", private: false })
    )
    mockMeUpdateUserInterestLoader.mockResolvedValueOnce(
      Promise.resolve({ id: "id-2", private: true })
    )
    mockMeUpdateUserInterestLoader.mockResolvedValueOnce(
      Promise.resolve({ id: "id-3", private: false })
    )

    const mutation = gql`
      mutation {
        updateUserInterests(
          input: {
            userInterests: [
              { id: "id-1", private: false }
              { id: "id-2", private: true }
              { id: "id-3", private: false }
            ]
          }
        ) {
          userInterestsOrErrors {
            ... on UserInterest {
              private
            }
          }
        }
      }
    `

    const result = await runAuthenticatedQuery(mutation, context)

    expect(mockMeUpdateUserInterestLoader).toHaveBeenNthCalledWith(1, "id-1", {
      private: false,
    })
    expect(mockMeUpdateUserInterestLoader).toHaveBeenNthCalledWith(2, "id-2", {
      private: true,
    })
    expect(mockMeUpdateUserInterestLoader).toHaveBeenNthCalledWith(3, "id-3", {
      private: false,
    })

    expect(result).toMatchInlineSnapshot(`
      {
        "updateUserInterests": {
          "userInterestsOrErrors": [
            {
              "private": false,
            },
            {
              "private": true,
            },
            {
              "private": false,
            },
          ],
        },
      }
    `)
  })
})
