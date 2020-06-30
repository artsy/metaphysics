import gql from "lib/gql"
import { runQuery } from "schema/v2/test/utils"

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
        showsConnection(ids: ["5c406911d545090509a857b9"]) {
          edges {
            node {
              internalID
            }
          }
        }
      }
    `
    const { showsConnection } = await runQuery(query, { showsLoader })
    expect(showsConnection.edges[0].node.internalID).toEqual(
      "5c406911d545090509a857b9"
    )
  })
})
