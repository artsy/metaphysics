import gql from "lib/gql"
import { runAuthenticatedQuery } from "schema/v2/test/utils"

const computeMutationWithInput = (input = ``): string => {
  const mutation = gql`
    mutation {
      deleteUserInterestForUser(
        input: ${input}
      ) {
        userInterestOrError {
          __typename
              ... on deleteUserInterestForUserSuccess {
              userInterest {
                body
                interest {
                  __typename
                  ... on Gene {
                    name
                    mode
                  }
                }
              }
              user {
                email
              }
            }
            ... on deleteUserInterestForUserFailure {
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

  return mutation
}

describe("deleteUserInterestForUserMutation", () => {
  describe("on success", () => {
    const user = {
      id: "parcy-z",
      email: "percy-z@catsy.net",
    }

    const geneInterest = {
      id: "example",
      body: "example body",
      interest: {
        name: "example name",
      },
    }

    const mockDeleteUserInterestLoader = jest.fn()
    const mockUserByIDLoader = jest.fn()

    const context = {
      deleteUserInterestLoader: mockDeleteUserInterestLoader,
      userByIDLoader: mockUserByIDLoader,
    }

    beforeEach(() => {
      mockDeleteUserInterestLoader.mockResolvedValue(
        Promise.resolve(geneInterest)
      )
      mockUserByIDLoader.mockResolvedValue(Promise.resolve(user))
    })

    afterEach(() => {
      mockDeleteUserInterestLoader.mockReset()
      mockUserByIDLoader.mockReset()
    })

    it("returns the deleted user interest", async () => {
      const mutation = computeMutationWithInput(`{ id: "example" }`)
      const res = await runAuthenticatedQuery(mutation, context)

      expect(mockDeleteUserInterestLoader).toBeCalledWith("example")
      expect(mockUserByIDLoader).not.toBeCalled()

      expect(res).toEqual({
        deleteUserInterestForUser: {
          userInterestOrError: {
            __typename: "deleteUserInterestForUserSuccess",
            userInterest: {
              body: "example body",
              interest: {
                __typename: "Gene",
                name: "example name",
                mode: "artist",
              },
            },
            user: null,
          },
        },
      })
    })

    it("returns the deleted user interest along with a user", async () => {
      const mutation = computeMutationWithInput(
        `{ id: "example", userId: "percy-z" }`
      )
      const res = await runAuthenticatedQuery(mutation, context)

      expect(mockDeleteUserInterestLoader).toBeCalledWith("example")
      expect(mockUserByIDLoader).toBeCalledWith("percy-z")

      expect(res).toEqual({
        deleteUserInterestForUser: {
          userInterestOrError: {
            __typename: "deleteUserInterestForUserSuccess",
            userInterest: {
              body: "example body",
              interest: {
                __typename: "Gene",
                name: "example name",
                mode: "artist",
              },
            },
            user: {
              email: "percy-z@catsy.net",
            },
          },
        },
      })
    })
  })

  describe("on failure", () => {
    const context = {
      deleteUserInterestLoader: () =>
        Promise.reject(
          new Error(
            `https://stagingapi.artsy.net/api/v1/user_interest/638fa3158f830b000d946f4d1? - {"error":"User Interest Not Found"}`
          )
        ),
    }

    it("returns a mutation error", async () => {
      const mutation = computeMutationWithInput(`{ id: "example" }`)
      const res = await runAuthenticatedQuery(mutation, context)

      expect(res).toEqual({
        deleteUserInterestForUser: {
          userInterestOrError: {
            __typename: "deleteUserInterestForUserFailure",
            mutationError: {
              type: "error",
              message: "User Interest Not Found",
              detail: null,
            },
          },
        },
      })
    })
  })
})
