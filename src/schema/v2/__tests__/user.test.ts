import { runAuthenticatedQuery } from "schema/v2/test/utils"
import gql from "lib/gql"
import { HTTPError } from "lib/HTTPError"

describe("User", () => {
  it("returns true if a user exist", async () => {
    const foundUser = {
      id: "123456",
      _id: "000012345",
      name: "foo bar",
      pin: "3141",
      paddle_number: "314159",
    }

    const userByEmailLoader = (data) => {
      if (data) {
        return Promise.resolve(foundUser)
      }
      throw new Error("Unexpected invocation")
    }

    const query = gql`
      {
        user(email: "foo@bar.com") {
          pin
          paddleNumber
          userAlreadyExists
        }
      }
    `

    const { user } = await runAuthenticatedQuery(query, { userByEmailLoader })
    expect(user.pin).toEqual("3141")
    expect(user.paddleNumber).toEqual("314159")
    expect(user.userAlreadyExists).toEqual(true)
  })

  it("returns false if user is not found by email", async () => {
    const notFoundUser = { error: "User Not Found" }
    const error = new HTTPError(notFoundUser.error, 404)
    const userByEmailLoader = (data) => {
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
