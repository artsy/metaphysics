import { runAuthenticatedQuery } from "schema/v2/test/utils"

describe("deleteUserInterestsMutation", () => {
  const mutation = `
    mutation {
      deleteUserInterests(input: { ids: ["user_interest_id_1", "user_interest_id_2"] }) {
        userInterestsOrError {
          ... on deleteUserInterestsSuccess {
            userInterests {
              category
              interest {
                ... on Artist {
                  name
                }
              }
            }
          }
        }
      }
    }
  `

  const userInterest = {
    category: "collected_before",
    interest: {
      birthday: "10.10.2000", // without birthday it resolves to GeneType
      name: "Artist Name",
    },
  }

  const mockMeDeleteUserInterestLoader = jest.fn()

  const context = {
    meDeleteUserInterestLoader: mockMeDeleteUserInterestLoader,
  }

  beforeEach(() => {
    mockMeDeleteUserInterestLoader.mockResolvedValue(
      Promise.resolve(userInterest)
    )
  })

  afterEach(() => {
    mockMeDeleteUserInterestLoader.mockReset()
  })

  it("returns the list of all the deleted user_interests", async () => {
    const res = await runAuthenticatedQuery(mutation, context)

    expect(res).toEqual({
      deleteUserInterests: {
        userInterestsOrError: {
          userInterests: [
            { category: "COLLECTED_BEFORE", interest: { name: "Artist Name" } },
            { category: "COLLECTED_BEFORE", interest: { name: "Artist Name" } },
          ],
        },
      },
    })
  })

  it("calls the loader with all the provided ids", async () => {
    await runAuthenticatedQuery(mutation, context)

    expect(mockMeDeleteUserInterestLoader).toHaveBeenCalledTimes(2)
    expect(mockMeDeleteUserInterestLoader).toHaveBeenNthCalledWith(
      1,
      "user_interest_id_1"
    )
    expect(mockMeDeleteUserInterestLoader).toHaveBeenNthCalledWith(
      2,
      "user_interest_id_2"
    )
  })
})
