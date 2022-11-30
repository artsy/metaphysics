import { runAuthenticatedQuery } from "schema/v2/test/utils"

describe("createUserInterestMutation", () => {
  const mutationOnMe = `
    mutation {
      createUserInterest(input: {category: COLLECTED_BEFORE, interestId: "example", interestType: ARTIST}) {
        userInterest {
          interest {
            ... on Artist {
              name
            }
          }
        }
      }
    }
  `
  const mutation = `
    mutation {
      createUserInterest(input: {
        category: INTERESTED_IN_COLLECTING,
        interestId: "example",
        interestType: ARTIST
        body: "example body",
        userId: "person",
        ownerType: USER_SALE_PROFILE
      }) {
        userInterest {
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
  }

  const mockMeCreateUserInterestLoader = jest.fn()
  const mockCreateUserInterestLoader = jest.fn()

  const context = {
    meCreateUserInterestLoader: mockMeCreateUserInterestLoader,
    createUserInterestLoader: mockCreateUserInterestLoader,
  }

  beforeEach(() => {
    mockMeCreateUserInterestLoader.mockResolvedValue(
      Promise.resolve(userInterest)
    )
    mockCreateUserInterestLoader.mockResolvedValue(
      Promise.resolve(userInterest)
    )
  })

  afterEach(() => {
    mockMeCreateUserInterestLoader.mockReset()
    mockCreateUserInterestLoader.mockReset()
  })

  it("returns a user interest", async () => {
    const res = await runAuthenticatedQuery(mutationOnMe, context)

    expect(res).toEqual({
      createUserInterest: {
        userInterest: {
          interest: {
            name: "Example Name",
          },
        },
      },
    })
  })

  it("calls the 'me' loader with the correct input", async () => {
    await runAuthenticatedQuery(mutationOnMe, context)

    expect(mockMeCreateUserInterestLoader).toBeCalledWith({
      category: "collected_before",
      interest_id: "example",
      interest_type: "Artist",
    })
    expect(mockCreateUserInterestLoader).not.toBeCalled()
  })
  it("calls the loader with the correct input", async () => {
    await runAuthenticatedQuery(mutation, context)

    expect(mockCreateUserInterestLoader).toBeCalledWith({
      category: "interested_in_collecting",
      interest_id: "example",
      interest_type: "Artist",
      body: "example body",
      user_id: "person",
      owner_type: "UserSaleProfile",
    })
    expect(mockMeCreateUserInterestLoader).not.toBeCalled()
  })
})
