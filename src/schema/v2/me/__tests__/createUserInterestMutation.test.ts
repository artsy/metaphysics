import { runAuthenticatedQuery } from "schema/v2/test/utils"

describe("createUserInterestMutation", () => {
  const mutation = `
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

  const userInterest = {
    interest: {
      birthday: "", // Used to differentiate type
      name: "Example Name",
    },
  }

  const mockCreateUserInterestLoader = jest.fn()

  const context = {
    createUserInterestLoader: mockCreateUserInterestLoader,
  }

  beforeEach(() => {
    mockCreateUserInterestLoader.mockResolvedValue(
      Promise.resolve(userInterest)
    )
  })

  afterEach(() => {
    mockCreateUserInterestLoader.mockReset()
  })

  it("returns a user interest", async () => {
    const res = await runAuthenticatedQuery(mutation, context)

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

  it("calls the loader with the correct input", async () => {
    await runAuthenticatedQuery(mutation, context)

    expect(mockCreateUserInterestLoader).toBeCalledWith({
      category: "collected_before",
      interest_id: "example",
      interest_type: "Artist",
    })
  })
})
