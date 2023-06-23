import { runAuthenticatedQuery } from "schema/v2/test/utils"

describe("createUserInterestMutation", () => {
  const mutation = `
    mutation {
      createUserInterest(input: {category: COLLECTED_BEFORE, interestId: "example", interestType: ARTIST, private: false}) {
        userInterest {
          private
          interest {
            ... on Artist {
              name
            }
          }
        }
      }
    }
  `

  const userInterest = {
    interest: {
      birthday: "", // Used to differentiate type
      name: "Example Name",
    },
    private: false,
  }

  const mockMeCreateUserInterestLoader = jest.fn()

  const context = {
    meCreateUserInterestLoader: mockMeCreateUserInterestLoader,
  }

  beforeEach(() => {
    mockMeCreateUserInterestLoader.mockResolvedValue(
      Promise.resolve(userInterest)
    )
  })

  afterEach(() => {
    mockMeCreateUserInterestLoader.mockReset()
  })

  it("returns a user interest", async () => {
    const res = await runAuthenticatedQuery(mutation, context)

    expect(res).toEqual({
      createUserInterest: {
        userInterest: {
          private: false,
          interest: {
            name: "Example Name",
          },
        },
      },
    })
  })

  it("calls the loader with the correct input", async () => {
    await runAuthenticatedQuery(mutation, context)

    expect(mockMeCreateUserInterestLoader).toBeCalledWith({
      private: false,
      category: "collected_before",
      interest_id: "example",
      interest_type: "Artist",
    })
  })
})
