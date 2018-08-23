import { runAuthenticatedQuery } from "test/utils"
import gql from "lib/gql"

describe("User", () => {
  it("returns true if a user exist", async () => {
    const foundUser = {
      id: "123456",
      _id: "000012345",
      name: "foo bar",
    }
    const userByEmailLoader = data => {
      if (data) {
        return Promise.resolve(foundUser)
      }
      throw new Error("Unexpected invocation")
    }
    const query = gql`
      {
        user(email: "foo@bar.com") {
          userAlreadyExists
        }
      }
    `

    const { user } = await runAuthenticatedQuery(query, { userByEmailLoader })
    expect(user.userAlreadyExists).toEqual(true)
  })

  it("returns false if user is not found by email", async () => {
    const notFoundUser = { error: "User Not Found" }
    const error = new Error(notFoundUser)
    error.statusCode = 404
    const userByEmailLoader = data => {
      if (data) {
        return Promise.resolve(notFoundUser)
      }
      throw error
    }
    const query = gql`
      {
        user(email: "nonexistentuser@bar.com") {
          userAlreadyExists
        }
      }
    `
    const { user } = await runAuthenticatedQuery(query, { userByEmailLoader })
    expect(user.userAlreadyExists).toEqual(false)
  })
})
