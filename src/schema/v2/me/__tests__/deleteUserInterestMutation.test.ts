import { runAuthenticatedQuery } from "schema/v2/test/utils"

describe("deleteUserInterestMutation", () => {
  const mutation = `
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

  const userInterest = {
    interest: {
      id: "example",
      birthday: "", // Used to differentiate type
      name: "Example Name",
    },
  }

  const mockCreateUserInterestLoader = jest.fn()

  const context = {
    deleteUserInterestLoader: mockCreateUserInterestLoader,
  }

  beforeEach(() => {
    mockCreateUserInterestLoader.mockResolvedValue(
      Promise.resolve(userInterest)
    )
  })

  afterEach(() => {
    mockCreateUserInterestLoader.mockReset()
  })

  it("returns the deleted user interest", async () => {
    const res = await runAuthenticatedQuery(mutation, context)

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

  it("calls the loader with the correct input", async () => {
    await runAuthenticatedQuery(mutation, context)

    expect(mockCreateUserInterestLoader).toBeCalledWith("example", {})
  })
})
