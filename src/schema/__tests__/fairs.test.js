import { runQuery } from "test/utils"
import gql from "lib/gql"

describe("Fairs", () => {
  it("returns a list of fairs matching array of ids", async () => {
    const fairsLoader = ({ id }) => {
      if (id) {
        return Promise.resolve(id.map(_id => ({ _id })))
      }
      throw new Error("Unexpected invocation")
    }
    const query = gql`
      {
        fairs(ids: ["5a9075da8b3b817ede4f8767"]) {
          _id
        }
      }
    `
    const { fairs } = await runQuery(query, { fairsLoader })
    expect(fairs[0]._id).toEqual("5a9075da8b3b817ede4f8767")
  })
})
