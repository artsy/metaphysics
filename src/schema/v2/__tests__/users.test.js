import { runAuthenticatedQuery } from "schema/v2/test/utils"
import gql from "lib/gql"

xdescribe("Users", () => {
  it("returns a list of users matching array of ids", async () => {
    const usersLoader = (data) => {
      if (data.id) {
        return Promise.resolve(data.id.map((id) => ({ id })))
      }
      throw new Error("Unexpected invocation")
    }
    const query = gql`
      {
        users(ids: ["5a9075da8b3b817ede4f8767"]) {
          internalID
        }
      }
    `
    const { users } = await runAuthenticatedQuery(query, { usersLoader })
    expect(users[0].internalID).toEqual("5a9075da8b3b817ede4f8767")
  })
})
