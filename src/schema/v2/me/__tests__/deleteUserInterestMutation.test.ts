import { runAuthenticatedQuery } from "schema/v2/test/utils"

describe("deleteUserInterestMutation", () => {
  const mutationOnMe = `
    mutation {
      deleteUserInterest(input: {id: "example"}) {
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
    deleteUserInterest(input: {id: "example", isOnMe: false}) {
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
      id: "example",
      birthday: "", // Used to differentiate type
      name: "Example Name",
    },
  }

  const mockMeDeleteUserInterestLoader = jest.fn()
  const mockDeleteUserInterestLoader = jest.fn()

  const context = {
    meDeleteUserInterestLoader: mockMeDeleteUserInterestLoader,
    deleteUserInterestLoader: mockDeleteUserInterestLoader,
  }

  beforeEach(() => {
    mockMeDeleteUserInterestLoader.mockResolvedValue(
      Promise.resolve(userInterest)
    )
    mockDeleteUserInterestLoader.mockResolvedValue(
      Promise.resolve(userInterest)
    )
  })

  afterEach(() => {
    mockMeDeleteUserInterestLoader.mockReset()
    mockDeleteUserInterestLoader.mockReset()
  })

  it("returns the deleted user interest", async () => {
    const res = await runAuthenticatedQuery(mutationOnMe, context)

    expect(res).toEqual({
      deleteUserInterest: {
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

    expect(mockMeDeleteUserInterestLoader).toBeCalledWith("example", {
      is_on_me: true,
    })
    expect(mockDeleteUserInterestLoader).not.toBeCalled()
  })

  it("calls the loader with the correct input when deleting for another user", async () => {
    await runAuthenticatedQuery(mutation, context)

    expect(mockDeleteUserInterestLoader).toBeCalledWith("example", {
      is_on_me: false,
    })
    expect(mockMeDeleteUserInterestLoader).not.toBeCalled()
  })
})
