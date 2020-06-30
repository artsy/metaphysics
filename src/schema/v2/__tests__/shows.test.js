import gql from "lib/gql"
import { runQuery } from "test/utils"

describe("Shows", () => {
  it("returns a list of shows matching array of ids", async () => {
    const showsLoader = ({ id }) => {
      if (id) {
        return Promise.resolve(
          id.map((id) => ({
            _id: id,
          }))
        )
      }
      throw new Error("Unexpected invocation")
    }

    const query = gql`
      {
        shows(ids: ["5c406911d545090509a857b9"]) {
          edges {
            node {
              internalID
            }
          }
        }
      }
    `
    const { shows } = await runQuery(query, { showsLoader })
    expect(shows.edges[0].node.internalID).toEqual("5c406911d545090509a857b9")
  })
})
