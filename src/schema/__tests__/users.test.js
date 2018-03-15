import { runAuthenticatedQuery } from "test/utils"
import gql from "test/gql"

describe("Users", () => {
  it("returns a list of users matching array of ids", async () => {
    const usersLoader = ({ ids }) => {
      if (ids) {
        return Promise.resolve(
          ids.map(id => ({ id }))
        )
      }
      throw new Error("Unexpected invocation")
    }
    const query = gql`
      {
        users(ids: ["5a9075da8b3b817ede4f8767"]) {
          id
        }
      }
    `
    const { users } = await runAuthenticatedQuery(query, { usersLoader })
    expect(users[0].id).toEqual("5a9075da8b3b817ede4f8767")
  })
})
