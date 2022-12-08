import gql from "lib/gql"
import { runAuthenticatedQuery } from "schema/v2/test/utils"

const mutation = gql`
  mutation {
    deleteUserInterestForUser(input: { id: "example" }) {
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

describe("deleteUserInterestForUserMutation", () => {
  describe("on success", () => {
    const geneInterest = {
      id: "example",
      body: "example body",
      interest: {
        name: "example name",
      },
    }

    const mockDeleteUserInterestLoader = jest.fn()

    const context = {
      deleteUserInterestLoader: mockDeleteUserInterestLoader,
    }

    beforeEach(() => {
      mockDeleteUserInterestLoader.mockResolvedValue(
        Promise.resolve(geneInterest)
      )
    })

    afterEach(() => {
      mockDeleteUserInterestLoader.mockReset()
    })

    it("returns the deleted user interest", async () => {
      const res = await runAuthenticatedQuery(mutation, context)

      expect(mockDeleteUserInterestLoader).toBeCalledWith("example")

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
