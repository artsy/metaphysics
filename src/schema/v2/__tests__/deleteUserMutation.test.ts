import gql from "lib/gql"
import { HTTPError } from "lib/HTTPError"
import { runAuthenticatedQuery } from "schema/v2/test/utils"

const mutation = gql`
  mutation {
    deleteUser(input: { id: "bats" }) {
      userOrError {
        __typename
        ... on DeleteUserSuccess {
          user {
            internalID
          }
        }
        ... on DeleteUserFailure {
          mutationError {
            message
            statusCode
          }
        }
      }
    }
  }
`

describe("Delete a user", () => {
  describe("when success", () => {
    const user = {
      id: "bats",
    }

    const context = {
      deleteUserLoader: () => Promise.resolve(user),
    }

    it("returns a user", async () => {
      const data = await runAuthenticatedQuery(mutation, context)
      expect(data).toEqual({
        deleteUser: {
          userOrError: {
            __typename: "DeleteUserSuccess",
            user: {
              internalID: "bats",
            },
          },
        },
      })
    })
  })

  describe("when validation like failure", () => {
    it("returns an error", async () => {
      const context = {
        deleteUserLoader: () =>
          Promise.reject(
            new HTTPError(
              `https://stagingapi.artsy.net/api/v1/user/bats? - {"error":"User Not Found"}`,
              404,
              { error: "User Not Found" }
            )
          ),
      }

      const response = await runAuthenticatedQuery(mutation, context)

      expect(response).toEqual({
        deleteUser: {
          userOrError: {
            __typename: "DeleteUserFailure",
            mutationError: {
              statusCode: 404,
              message: "User Not Found",
            },
          },
        },
      })
    })
  })

  describe("when illegal operation like failure", () => {
    it("returns an error", async () => {
      const context = {
        deleteUserLoader: () =>
          Promise.reject(
            new HTTPError(
              `https://stagingapi.artsy.net/api/v1/user/bats? - {"type":"illegal_operation","message":"Some Op Error"}`,
              400,
              { type: "illegal_operation", message: "Some Op Error" }
            )
          ),
      }

      const response = await runAuthenticatedQuery(mutation, context)

      expect(response).toEqual({
        deleteUser: {
          userOrError: {
            __typename: "DeleteUserFailure",
            mutationError: {
              statusCode: 400,
              message: "Some Op Error",
            },
          },
        },
      })
    })
  })
})
