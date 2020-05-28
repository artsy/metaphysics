import { runQuery } from "schema/v2/test/utils"
import gql from "lib/gql"

describe("Fairs", () => {
  // FIXME: Unable to resolve fairs object?
  it.skip("returns a list of fairs matching array of ids", async () => {
    const fairsLoader = ({ id }) => {
      if (id) {
        return Promise.resolve({
          body: id.map((internalID) => ({ internalID })),
        }).then((r) => console.log(r) || r)
      }
      throw new Error("Unexpected invocation")
    }
    const query = gql`
      {
        fairs(ids: ["5a9075da8b3b817ede4f8767"]) {
          internalID
        }
      }
    `
    const { fairs } = await runQuery(query, { fairsLoader })
    expect(fairs[0].internalID).toEqual("5a9075da8b3b817ede4f8767")
  })
})
